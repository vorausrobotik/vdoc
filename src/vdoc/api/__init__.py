"""Contains the Rest API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from servestatic.asgi import ServeStaticASGI
from starlette.requests import Request

from vdoc.api import lifespan
from vdoc.exceptions import VDocException

# Vite writes the build's content hash into the name of every asset it emits, as eight characters
# between a dash and the extension. A file whose name carries one is never rewritten, so a client that
# has it never has to ask for it again. Everything else, `index.html` above all, keeps the short
# lifetime that lets a deploy take effect.
_HASHED_ASSET_NAME = r"-[A-Za-z0-9_-]{8}\."


def create_app() -> ServeStaticASGI:
    """Creates the ASGI application.

    The API and the web UI's own routes are a FastAPI app, wrapped in a static file server that answers
    for the files of the built web UI and passes everything else through. That server is what sends the
    compressed copy the UI build wrote next to each asset, and what says how long each may be cached.

    Returns:
        The application, ready to be served.
    """
    app = FastAPI(docs_url="/apidoc", lifespan=lifespan.routes_loader_lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(VDocException)
    async def unicorn_exception_handler(_: Request, exc: VDocException) -> JSONResponse:
        """Catches all ``VDocException`` exceptions and returns them as properly formatted JSONResponse.

        Args:
            exc: The caught exception.

        Returns:
            The exception as formatted JSONResponse.
        """
        return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})

    return ServeStaticASGI(application=app, root=lifespan.webapp_path, immutable_file_test=_HASHED_ASSET_NAME)
