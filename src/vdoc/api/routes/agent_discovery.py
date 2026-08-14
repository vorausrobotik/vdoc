"""Contains the routes an automated reader looks for."""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from starlette.requests import Request

from vdoc.methods.api.agent_discovery import get_public_base_url, render_llms_txt_impl, render_robots_txt_impl

router = APIRouter(tags=["Agent discovery"])


@router.get("/llms.txt", response_class=PlainTextResponse)
def get_llms_txt(request: Request) -> PlainTextResponse:
    """Serves the ``llms.txt`` index of everything currently published.

    Args:
        request: The incoming request, which is what knows the public base URL to link to.

    Returns:
        The rendered ``llms.txt``.
    """
    return PlainTextResponse(content=render_llms_txt_impl(base_url=get_public_base_url(request=request)))


@router.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt(request: Request) -> PlainTextResponse:
    """Serves ``robots.txt``, which points at ``llms.txt``.

    Args:
        request: The incoming request, which is what knows the public base URL to link to.

    Returns:
        The rendered ``robots.txt``.
    """
    return PlainTextResponse(content=render_robots_txt_impl(base_url=get_public_base_url(request=request)))
