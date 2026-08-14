"""Contains the routes an automated reader looks for."""

from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse
from starlette.requests import Request

from vdoc.methods.api.agent_discovery import (
    get_public_base_url,
    render_llms_txt_impl,
    render_robots_txt_impl,
    render_sitemap_xml_impl,
)

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


@router.get("/sitemap.xml", response_class=Response)
def get_sitemap_xml(request: Request) -> Response:
    """Serves the ``sitemap.xml`` listing the entry point of every published project.

    Args:
        request: The incoming request, which is what knows the public base URL to link to.

    Returns:
        The rendered ``sitemap.xml``.
    """
    return Response(
        content=render_sitemap_xml_impl(base_url=get_public_base_url(request=request)),
        media_type="application/xml",
    )


@router.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt(request: Request) -> PlainTextResponse:
    """Serves ``robots.txt``, which points at ``llms.txt`` and at ``sitemap.xml``.

    Args:
        request: The incoming request, which is what knows the public base URL to link to.

    Returns:
        The rendered ``robots.txt``.
    """
    return PlainTextResponse(content=render_robots_txt_impl(base_url=get_public_base_url(request=request)))
