"""Contains all plugin routes."""

from fastapi import APIRouter

from vdoc.models.plugins.base import Plugin


def get_router() -> APIRouter:
    """Dynamically configures the router and loads all plugin routes.

    Returns:
        The FastAPI router instance.
    """
    router = APIRouter(prefix="/plugins")
    loaded_plugins = list(Plugin.load_plugins())
    for plugin in loaded_plugins:
        router.include_router(plugin.router, prefix=f"/{plugin.name}", tags=[f"Plugins.{plugin.name}"])

    @router.get("/")
    def get_plugins() -> list[str]:
        """Get all loaded plugins.

        Returns:
            A list of loaded plugin names.
        """
        return [plugin.name for plugin in loaded_plugins]

    return router
