"""Defines the FastAPI lifespan and route loading."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.routing import Mount
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from vdoc.api.routes import project_categories as PROJECT_CATEGORIES_MODULE
from vdoc.api.routes import projects as PROJECTS_MODULE
from vdoc.api.routes import settings as SETTINGS_MODULE
from vdoc.api.routes import version as VERSION_MODULE
from vdoc.methods.api.projects import get_project_version_impl
from vdoc.settings import VDocSettings

_PACKAGE_PATH = Path(__file__).parent.parent

webapp_path = _PACKAGE_PATH / "webapp"
docs_path = _PACKAGE_PATH / "docs"


@asynccontextmanager
async def routes_loader_lifespan(fastapi: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for the FastAPI app.

    The order for mounting the routers is important. The frontend router must be the last one to ensure that all
    non-api or documentation requests are handled by the frontend.

    Args:
        fastapi: The FastAPI app instance.

    Yields:
        None: No value is yielded.
    """
    fastapi = _include_static_api_routers(fastapi=fastapi)
    fastapi = _include_intersphinx_router(fastapi=fastapi)
    fastapi = _include_static_documentation_routers(fastapi=fastapi)
    fastapi = _include_frontend_router(fastapi=fastapi)
    yield


def _include_static_api_routers(fastapi: FastAPI) -> FastAPI:
    fastapi.include_router(PROJECTS_MODULE.router, prefix="/api")
    fastapi.include_router(SETTINGS_MODULE.router, prefix="/api")
    fastapi.include_router(PROJECT_CATEGORIES_MODULE.router, prefix="/api")
    fastapi.include_router(VERSION_MODULE.router, prefix="/api")
    return fastapi


def _include_static_documentation_routers(fastapi: FastAPI) -> FastAPI:
    for route in [
        Mount(
            "/static/docs",
            app=StaticFiles(directory=str(docs_path), html=True, check_dir=False),
            name="vdoc-docs",
        ),
        Mount(
            "/static/projects",
            app=StaticFiles(directory=VDocSettings().docs_dir.as_posix(), html=True, check_dir=False),
            name="projects",
        ),
    ]:
        fastapi.routes.append(route)
    return fastapi


def _include_intersphinx_router(fastapi: FastAPI) -> FastAPI:
    @fastapi.get("/{project_name}/{version}/objects.inv")
    def serve_sphinx_objects_inventory(project_name: str, version: str) -> FileResponse:
        """Serves the objects.inv sphinx file for intersphinx mappings.

        Args:
            project_name: The requested project name.
            version: The requested project version.

        Returns:
            FileResponse: The objects.inv file.
        """
        served_version = get_project_version_impl(name=project_name, version=version)

        return FileResponse(path=VDocSettings().docs_dir / project_name / served_version / "objects.inv")

    return fastapi


def _include_frontend_router(fastapi: FastAPI) -> FastAPI:
    @fastapi.get("/{file_path:path}")
    def serve_ui_and_assets(file_path: str) -> FileResponse:
        """Serves the web UI and the static assets (JS bundles, ...) as a last fallback for all non-matched requests.

        Args:
            file_path (str): The requested file path.

        Returns:
            FileResponse: The requested asset file if existing, otherwise the index.html.
        """
        if (full_path := webapp_path / file_path).is_file():
            return FileResponse(path=full_path)
        return FileResponse(path=webapp_path / "index.html")

    return fastapi
