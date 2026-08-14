"""Contains all constant values."""

from pathlib import Path

from pydantic import AnyHttpUrl

CONFIG_ENV_PREFIX = "VDOC_"
CONFIG_ENV_PREFIX_PLUGINS = f"{CONFIG_ENV_PREFIX}PLUGINS_"

## CONFIGURATION FILE

# Which file to read, and which mapping of it each settings model owns. vdoc's own settings live under
# `vdoc:` and every plugin under `plugins.<name>:`, so that neither model is handed the other's keys.
CONFIG_FILE_ENV_VAR = f"{CONFIG_ENV_PREFIX}CONFIG_FILE"
CONFIG_FILE_SECTION_VDOC = ("vdoc",)
CONFIG_FILE_SECTION_PLUGINS = "plugins"

## ADDRESSING

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
DEFAULT_API_USERNAME = b"admin"
DEFAULT_API_PASSWORD = b"admin"
DEFAULT_BIND_ADDRESS = "0.0.0.0"  # noqa: S104
DEFAULT_BIND_PORT = 8080

## PLUGIN CONSTANTS

# Theme plugin
PLUGIN_THEME_DEFAULT_LOGO_URL = AnyHttpUrl("https://logos.vorausrobotik.com/v_rgb.png")
PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL = AnyHttpUrl("https://logos.vorausrobotik.com/v_rgb.png")
