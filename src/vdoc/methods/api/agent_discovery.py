"""Contains the documents that tell an automated reader what this instance holds.

``/llms.txt`` follows https://llmstxt.org and ``/robots.txt`` follows RFC 9309. Both are rendered from
templates in ``vdoc/templates`` and derived from what is actually published, so an upload is enough to
appear in them. The "Agent and crawler discovery" page of the documentation says what they contain.
"""

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


def _sections(projects: list[Project]) -> list[tuple[str, list[Project]]]:
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


def _inventories(projects: list[Project]) -> list[tuple[Project, str, str]]:
    """Collects the page inventories the newest version of each project actually ships.

    Args:
        projects: The projects to look at.

    Returns:
        The project, file name and description of every inventory file present.
    """
    docs_dir = get_settings().docs_dir

    return [
        (project, file_name, description)
        for project in projects
        for file_name, description in PAGE_INVENTORY_FILES.items()
        if (docs_dir / project.name / project.latest / file_name).is_file()
    ]


def render_llms_txt_impl(base_url: str) -> str:
    """Renders the ``llms.txt`` index of everything currently published.

    Args:
        base_url: The absolute base URL of this vdoc instance, without a trailing slash.

    Returns:
        The rendered ``llms.txt`` as markdown.
    """
    site = SitePlugin()

    # A project directory without a parsable version in it has nothing to link to, and asking it for its
    # latest version would raise. Leaving it out keeps one broken upload from taking the index down.
    projects = [project for project in Project.list() if project.versions]

    return _templates.get_template("llms.txt.j2").render(
        title=site.title or DEFAULT_SITE_TITLE,
        description=site.description,
        long_description=site.long_description or (),
        sections=_sections(projects=projects),
        inventories=_inventories(projects=projects),
        base_url=base_url,
        static_prefix=STATIC_PROJECTS_PREFIX,
        latest_alias=LATEST_VERSION_ALIAS,
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
