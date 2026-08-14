"""Defines the FastAPI lifespan and route loading."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, status
from fastapi.routing import Mount
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse, RedirectResponse

from vdoc.api.routes import agent_discovery as agent_discovery_module
from vdoc.api.routes import plugins as plugins_module
from vdoc.api.routes import project_categories as project_categories_module
from vdoc.api.routes import projects as projects_module
from vdoc.api.routes import version as version_module
from vdoc.config_file import log_configuration_source
from vdoc.constants import LATEST_VERSION_ALIAS, STATIC_PROJECTS_PREFIX
from vdoc.exceptions import ProjectInventoryNotFound
from vdoc.methods.api.projects import get_project_version_impl
from vdoc.models.project import Project
from vdoc.settings import get_settings

_PACKAGE_PATH = Path(__file__).parent.parent

webapp_path = _PACKAGE_PATH / "webapp"

_SPHINX_INVENTORY_FILE_NAME = "objects.inv"


@asynccontextmanager
async def routes_loader_lifespan(fastapi: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for the FastAPI app.

    The order for mounting the routers is important. The frontend router must be the last one to ensure that all
    non-api or documentation requests are handled by the frontend, and the ``latest`` redirect has to precede
    the static mount it redirects into.

    Args:
        fastapi: The FastAPI app instance.

    Yields:
        None: No value is yielded.
    """
    # Reported here rather than from the CLI, because `start_dev.py` runs uvicorn directly and never
    # goes through it, while every way of starting the app goes through the lifespan.
    log_configuration_source()

    fastapi = _include_static_api_routers(fastapi=fastapi)
    fastapi = _include_agent_discovery_router(fastapi=fastapi)
    fastapi = _include_intersphinx_router(fastapi=fastapi)
    fastapi = _include_static_latest_router(fastapi=fastapi)
    fastapi = _include_static_documentation_routers(fastapi=fastapi)
    fastapi = _include_frontend_router(fastapi=fastapi)
    yield


def _include_static_api_routers(fastapi: FastAPI) -> FastAPI:
    fastapi.include_router(projects_module.router, prefix="/api")
    fastapi.include_router(project_categories_module.router, prefix="/api")
    fastapi.include_router(version_module.router, prefix="/api")
    fastapi.include_router(plugins_module.get_router(), prefix="/api")
    return fastapi


def _include_agent_discovery_router(fastapi: FastAPI) -> FastAPI:
    fastapi.include_router(agent_discovery_module.router)
    return fastapi


def _include_static_documentation_routers(fastapi: FastAPI) -> FastAPI:
    fastapi.routes.append(
        Mount(
            STATIC_PROJECTS_PREFIX,
            app=StaticFiles(directory=get_settings().docs_dir.as_posix(), html=True, check_dir=False),
            name="projects",
        )
    )
    return fastapi


def _include_intersphinx_router(fastapi: FastAPI) -> FastAPI:
    @fastapi.get(f"/{{project_name}}/{{version}}/{_SPHINX_INVENTORY_FILE_NAME}")
    def serve_sphinx_objects_inventory(project_name: str, version: str) -> FileResponse:
        """Serves the objects.inv sphinx file for intersphinx mappings.

        Args:
            project_name: The requested project name.
            version: The requested project version.

        Raises:
            ProjectInventoryNotFound: If the project version doesn't contain an objects.inv file.

        Returns:
            FileResponse: The objects.inv file.
        """
        served_version = get_project_version_impl(name=project_name, version=version)
        inventory_path = get_settings().docs_dir / project_name / served_version / _SPHINX_INVENTORY_FILE_NAME

        # Only a generator that builds on Sphinx writes one. Without this check, asking a version built by
        # any other generator for its inventory raises out of FileResponse as a 500.
        if not inventory_path.is_file():
            raise ProjectInventoryNotFound(
                name=project_name, version=served_version, inventory=_SPHINX_INVENTORY_FILE_NAME
            )

        return FileResponse(path=inventory_path)

    return fastapi


def _include_static_latest_router(fastapi: FastAPI) -> FastAPI:
    @fastapi.get(f"{STATIC_PROJECTS_PREFIX}/{{project_name}}/{LATEST_VERSION_ALIAS}/{{file_path:path}}")
    def redirect_latest_to_published_version(project_name: str, file_path: str) -> RedirectResponse:
        """Redirects a ``latest`` static address to the newest published version of the project.

        Redirecting rather than serving the file under the ``latest`` address is what keeps relative links
        inside the page working: the browser resolves them against the address it ended up on, which has
        to be the resolved version for them to stay inside it.

        Args:
            project_name: The requested project name.
            file_path: The path of the requested file within the published version.

        Returns:
            A temporary redirect to the same file under the resolved version. Temporary, because which
            version ``latest`` names changes with every upload.
        """
        served_version = get_project_version_impl(name=project_name, version=LATEST_VERSION_ALIAS)

        return RedirectResponse(
            url=f"{STATIC_PROJECTS_PREFIX}/{project_name}/{served_version}/{file_path}",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    return fastapi


def _resolve_webapp_asset(file_path: str) -> Path | None:
    """Resolves a request path to a file shipped with the web UI.

    Args:
        file_path: The requested file path.

    Returns:
        The path of the asset, or None if the request does not name one inside the web UI directory.
    """
    webapp_root = webapp_path.resolve()
    asset_path = (webapp_root / file_path).resolve()

    # A request path is untrusted input, and ``/`` on a Path appends ``..`` segments rather than resolving
    # them, so the joined path can leave the web UI directory. Nothing outside it is ours to serve.
    if not asset_path.is_relative_to(webapp_root):
        return None

    return asset_path if asset_path.is_file() else None


def _is_frontend_route(file_path: str) -> bool:
    """Reports whether the web UI has a route for a request path.

    The UI's route surface is the landing page, a project, a version of a project, and any page within
    that version. So a path is a route exactly when the project it names exists and the version it names,
    if any, is published.

    The page itself is deliberately not checked: a single page documentation routes its pages client
    side, so most of them have no file of their own to look for.

    Args:
        file_path: The requested file path.

    Returns:
        True if the UI can render this path, False otherwise.
    """
    if not (segments := [segment for segment in file_path.split("/") if segment]):
        return True

    project_name, *rest = segments

    return Project.is_published(name=project_name, version=rest[0] if rest else None)


def _include_frontend_router(fastapi: FastAPI) -> FastAPI:
    @fastapi.get("/{file_path:path}")
    def serve_ui_and_assets(file_path: str) -> FileResponse:
        """Serves the web UI and the static assets (JS bundles, ...) as a last fallback for all non-matched requests.

        The UI is returned for anything it has a route for, and for everything else too -- but under a
        404, so that a reader still gets vdoc's own not-found page while a crawler, an agent or a link
        checker is told the truth. Answering 200 for every path made this the last route that never
        fails, which left `/robots.txt` and every typo looking like a published document.

        Args:
            file_path (str): The requested file path.

        Returns:
            FileResponse: The requested asset file if existing, otherwise the index.html.
        """
        if (asset_path := _resolve_webapp_asset(file_path=file_path)) is not None:
            return FileResponse(path=asset_path)

        return FileResponse(
            path=webapp_path / "index.html",
            status_code=status.HTTP_200_OK if _is_frontend_route(file_path=file_path) else status.HTTP_404_NOT_FOUND,
        )

    return fastapi
