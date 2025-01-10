"""Contains the Rest API."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import Mount
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import FileResponse, RedirectResponse
from starlette.routing import BaseRoute

from vdoc.api.routes import projects as DOCUMENTATION_MODULE
from vdoc.exceptions import VDocException
from vdoc.methods.api.projects import get_project_version_impl
from vdoc.settings import VDocSettings

_PACKAGE_PATH = Path(__file__).parent.parent

webapp_path = _PACKAGE_PATH / "webapp"
docs_path = _PACKAGE_PATH / "docs"

routes: list[BaseRoute] = [
    Mount(
        "/app",
        app=StaticFiles(directory=str(webapp_path), html=True, check_dir=False),
        name="ui",
    ),
    Mount(
        "/docs",
        app=StaticFiles(directory=str(docs_path), html=True, check_dir=False),
        name="vdoc-docs",
    ),
    Mount(
        "/projects",
        app=StaticFiles(directory=VDocSettings().docs_dir.as_posix(), html=True, check_dir=False),
        name="projects",
    ),
]

app = FastAPI(docs_url="/apidoc")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(DOCUMENTATION_MODULE.router, prefix="/api")


@app.exception_handler(VDocException)
async def unicorn_exception_handler(_: Request, exc: VDocException) -> JSONResponse:
    """Catches all ``VDocException`` exceptions and returns them as properly formatted JSONResponse.

    Args:
        exc: The catched exception.

    Returns:
        The exception as formatted JSONResponse.
    """
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


@app.get("/")
def redirect_root_to_app(request: Request) -> RedirectResponse:
    """Redirects everything from root to app route.

    Args:
        request: The incoming request.

    Returns:
        RedirectResponse: Redirection to the app route.
    """
    return RedirectResponse(f"app/?{request.query_params}")


@app.get("/app/projects/{project_name}/versions/{version}/objects.inv")
def serve_sphinx_objects_inventory(project_name: str, version: str) -> FileResponse:  # pylint: disable=unused-argument
    """Serves the objects.inv sphinx file for intersphinx mappings.

    Args:
        project_name: The requested project name.
        version: The requested project version.

    Returns:
        FileResponse: The objects.inv file.
    """
    served_version = get_project_version_impl(name=project_name, version=version)

    return FileResponse(path=VDocSettings().docs_dir / project_name / served_version / "objects.inv")


@app.get("/app/projects/{file_path:path}")
def redirect_foo(file_path: str) -> FileResponse:  # pylint: disable=unused-argument
    """Basic redirect for the web UI.

    Args:
        file_path (str): The requested project file path.

    Returns:
        FileResponse: The index.html.
    """
    return FileResponse(path=webapp_path / "index.html")


for route in routes:
    app.routes.append(route)
