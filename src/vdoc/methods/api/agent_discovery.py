"""Contains the documents that tell an automated reader what this instance holds.

``/llms.txt`` follows https://llmstxt.org, ``/robots.txt`` follows RFC 9309 and ``/sitemap.xml`` follows
the sitemaps protocol. All three are rendered from templates in ``vdoc/templates`` and derived from what
is actually published, so an upload is enough to appear in them. The "Agent and crawler discovery" page
of the documentation says what they contain.
"""

from collections.abc import Sequence
from functools import partial

from jinja2 import Environment, PackageLoader, select_autoescape
from starlette.requests import Request

from vdoc.constants import (
    DEFAULT_SITE_TITLE,
    LATEST_VERSION_ALIAS,
    PAGE_INVENTORY_FILES,
    STATIC_PROJECTS_PREFIX,
)
from vdoc.models.plugins.site import SitePlugin
from vdoc.models.project import Project
from vdoc.settings import get_settings

_UNCATEGORIZED_SECTION_TITLE = "Projects"

# Both documents are plain text, so the templates decide the whitespace: block tags are trimmed and the
# trailing newline is kept. Autoescaping stays off for text and on for the markup extensions, so that a
# template added later cannot quietly interpolate unescaped HTML.
_templates = Environment(
    loader=PackageLoader("vdoc", "templates"),
    autoescape=select_autoescape(enabled_extensions=("html", "xml"), default=False),
    trim_blocks=True,
    lstrip_blocks=True,
    keep_trailing_newline=True,
)


def get_public_base_url(request: Request) -> str:
    """Returns the absolute base URL this vdoc instance is reached under, without a trailing slash.

    Both documents list absolute URLs, so that they keep working once copied away from the site they were
    fetched from. Only the request knows which host that is, and behind a reverse proxy only its
    forwarded headers do.

    Those headers are attacker-controlled, which is harmless here: they are used for nothing but
    composing self-references into the very response the sender receives, so a forged host misleads no
    one but its sender.

    Args:
        request: The incoming request.

    Returns:
        The base URL of this instance.
    """
    forwarded_proto = request.headers.get("x-forwarded-proto")
    forwarded_host = request.headers.get("x-forwarded-host")
    scheme = forwarded_proto.split(",")[0].strip() if forwarded_proto else request.url.scheme
    host = forwarded_host.split(",")[0].strip() if forwarded_host else request.url.netloc

    return f"{scheme}://{host}"


def _sections(projects: Sequence[Project]) -> list[tuple[str, list[Project]]]:
    """Groups projects into their configured categories, in the order the categories are configured.

    Projects without a category are collected into a trailing section, so that a partially categorized
    instance still lists all of them.

    Args:
        projects: The projects to group.

    Returns:
        The title of each section and the projects in it, skipping the sections no project belongs to.
    """

    def members(category_id: int | None) -> list[Project]:
        # By display name, because that is the name the reader sees in the list
        return sorted(
            (project for project in projects if project.category_id == category_id),
            key=lambda project: project.display_name,
        )

    categories = sorted(get_settings().project_categories, key=lambda category: category.id)
    sections = [(category.name, members(category_id=category.id)) for category in categories]
    sections.append((_UNCATEGORIZED_SECTION_TITLE, members(category_id=None)))

    return [(title, section_projects) for title, section_projects in sections if section_projects]


def _static_url(base_url: str, project: Project, file_name: str) -> str:
    """Returns the address a file of a project's newest version is served at.

    Both documents link the same addresses, so both compose them here.

    Args:
        base_url: The absolute base URL of this vdoc instance, without a trailing slash.
        project: The project the file belongs to.
        file_name: The name of the file, relative to the version's root.

    Returns:
        The absolute static address of that file.
    """
    return f"{base_url}{STATIC_PROJECTS_PREFIX}/{project.name}/{project.latest}/{file_name}"


def _inventories(projects: Sequence[Project]) -> list[tuple[Project, str, str]]:
    """Collects the page inventories the newest version of each project actually ships.

    Args:
        projects: The projects to look at.

    Returns:
        The project, file name and description of every inventory file present.
    """
    return [
        (project, file_name, description)
        for project in projects
        for file_name, description in PAGE_INVENTORY_FILES.items()
        if project.latest_contains(file_name)
    ]


def _entry_points(projects: Sequence[Project], base_url: str) -> list[tuple[str, str]]:
    """Collects the static address a crawler should enter each project at, and when it last changed.

    The newest version only. Every superseded version says nearly the same thing at a different address,
    which is what a search engine counts as duplicated content, and the versions API enumerates them for
    a client that wants them all.

    Args:
        projects: The projects to enter.
        base_url: The absolute base URL of this vdoc instance, without a trailing slash.

    Returns:
        The absolute URL and the publication date of every project's entry point, skipping the projects
        whose newest version has no page to enter at.
    """
    return [
        (
            _static_url(base_url=base_url, project=project, file_name="index.html"),
            project.latest_published_on.isoformat(),
        )
        for project in projects
        if project.latest_contains("index.html")
    ]


def render_llms_txt_impl(base_url: str) -> str:
    """Renders the ``llms.txt`` index of everything currently published.

    Args:
        base_url: The absolute base URL of this vdoc instance, without a trailing slash.

    Returns:
        The rendered ``llms.txt`` as markdown.
    """
    site = SitePlugin()
    projects = Project.list_published()

    return _templates.get_template("llms.txt.j2").render(
        title=site.title or DEFAULT_SITE_TITLE,
        description=site.description,
        long_description=site.long_description or (),
        sections=_sections(projects=projects),
        inventories=_inventories(projects=projects),
        static=partial(_static_url, base_url),
        base_url=base_url,
        static_prefix=STATIC_PROJECTS_PREFIX,
        latest_alias=LATEST_VERSION_ALIAS,
    )


def render_sitemap_xml_impl(base_url: str) -> str:
    """Renders the ``sitemap.xml`` a crawler is pointed at from ``robots.txt``.

    Args:
        base_url: The absolute base URL of this vdoc instance, without a trailing slash.

    Returns:
        The rendered ``sitemap.xml``.
    """
    return _templates.get_template("sitemap.xml.j2").render(
        urls=_entry_points(projects=Project.list_published(), base_url=base_url),
    )


def render_robots_txt_impl(base_url: str) -> str:
    """Renders ``robots.txt``.

    Args:
        base_url: The absolute base URL of this vdoc instance, without a trailing slash.

    Returns:
        The rendered ``robots.txt``.
    """
    return _templates.get_template("robots.txt.j2").render(
        base_url=base_url,
        static_prefix=STATIC_PROJECTS_PREFIX,
    )
