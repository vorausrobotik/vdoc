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
