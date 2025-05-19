"""Contains the Rest API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request

from vdoc.api.lifespan import routes_loader_lifespan
from vdoc.exceptions import VDocException

app = FastAPI(docs_url="/apidoc", lifespan=routes_loader_lifespan)


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
        exc: The catched exception.

    Returns:
        The exception as formatted JSONResponse.
    """
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})
