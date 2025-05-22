"""Contains all integration routes."""

from fastapi import APIRouter

from vdoc.models.integrations.base import Integration


def get_router() -> APIRouter:
    """Dynamically configures the router and loads all integration routes.

    Returns:
        The FastAPI router instance.
    """
    router = APIRouter(prefix="/integrations")
    loaded_integrations = list(Integration.load_integrations())
    for integration in loaded_integrations:
        router.include_router(
            integration.router, prefix=f"/{integration.name}", tags=[f"Integrations.{integration.name}"]
        )

    @router.get("/")
    def get_integrations() -> list[str]:
        """Get all loaded integrations.

        Returns:
            A list of loaded integration names.
        """
        return [integration.name for integration in loaded_integrations]

    return router
