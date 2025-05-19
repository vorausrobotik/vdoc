"""Contains the version REST API routes."""

from fastapi import APIRouter

from vdoc import get_app_version

router = APIRouter(prefix="/version", tags=["Version"])


@router.get("/")
def get_app_version_route() -> str:
    """Returns the version of the app.

    Returns:
        The app version.
    """
    return get_app_version()
