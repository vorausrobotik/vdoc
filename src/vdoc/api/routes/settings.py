"""Contains all settings related REST API routes."""

from typing import Literal

from fastapi import APIRouter

from vdoc.settings import VDocSettings

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/logo_url/{mode}")
def get_logo_url(mode: Literal["dark", "light"]) -> str | None:
    """Returns logo url for the requested mode.

    Args:
        mode: The mode for which the logo url should be returned.

    Returns:
        The logo url for the requested mode if available, None otherwise.

    Raises:
        NotImplementedError: Never (guaranteed by the type hint).
    """
    if mode == "dark":
        return VDocSettings().logo_dark_url
    if mode == "light":
        return VDocSettings().logo_light_url
    raise NotImplementedError(f"Mode {mode} is not implemented.")  # pragma: no cover
