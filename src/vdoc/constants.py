"""Contains all constant values."""

from datetime import timedelta
from pathlib import Path

CONFIG_ENV_PREFIX = "VDOC_"
CONFIG_ENV_PREFIX_PLUGINS = f"{CONFIG_ENV_PREFIX}PLUGINS_"

## CONFIGURATION FILE

# Which file to read, and which mapping of it each settings model owns. vdoc's own settings live under
# `vdoc:` and every plugin under `plugins.<name>:`, so that neither model is handed the other's keys.
CONFIG_FILE_ENV_VAR = f"{CONFIG_ENV_PREFIX}CONFIG_FILE"
CONFIG_FILE_SECTION_VDOC = ("vdoc",)
CONFIG_FILE_SECTION_PLUGINS = "plugins"

## ADDRESSING

# The address of the admin page. The web UI routes it in the same namespace as the projects, so no
# project may be named like it, nor like any other path vdoc answers for itself.
ADMIN_ROUTE = "admin"
RESERVED_PROJECT_NAMES = frozenset({ADMIN_ROUTE, "api", "apidoc", "static"})

# Where the published files are served from, and the version alias that resolves to the newest one.
STATIC_PROJECTS_PREFIX = "/static/projects"
LATEST_VERSION_ALIAS = "latest"

## AGENT DISCOVERY

# The heading of llms.txt when the site plugin does not name the instance.
DEFAULT_SITE_TITLE = "Documentation"

# Files a documentation generator may ship that index its pages for a machine reader. vdoc advertises
# the ones a published version actually contains, so a project is described by what it has rather than
# by which generator built it. Sphinx writes the first, Docusaurus the other two.
#
# Deliberately not listed: Sphinx's `searchindex.js`. It says nothing `objects.inv` does not already say
# for the same version, and listing both put two lines per Sphinx project in a file whose whole value is
# being short enough to read in one go.
PAGE_INVENTORY_FILES = {
    "objects.inv": "Sphinx inventory of every page and cross-reference target (zlib-compressed)",
    "sitemap.xml": "XML sitemap of every page URL",
    "search-index.json": "full-text search index with the title and URL of every page",
}

DEFAULT_DOCS_DIR = Path("/srv/vdoc/docs/")
DEFAULT_CONFIG_FILE = Path("/srv/vdoc/vdoc.yaml")
DEFAULT_DATABASE_URL = "sqlite:////srv/vdoc/data/vdoc.db"

# The key under which the session holds the name of whoever logged in on the login page
SESSION_USER_KEY = "user"
# How long a login lasts without being used
SESSION_IDLE_TIMEOUT = timedelta(hours=8)
DEFAULT_API_USERNAME = b"admin"
DEFAULT_API_PASSWORD = b"admin"
DEFAULT_BIND_ADDRESS = "0.0.0.0"  # noqa: S104
DEFAULT_BIND_PORT = 8080
