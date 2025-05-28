"""Contains all constant values."""

from pathlib import Path

from pydantic import AnyHttpUrl

CONFIG_ENV_PREFIX = "VDOC_"
CONFIG_ENV_PREFIX_PLUGINS = f"{CONFIG_ENV_PREFIX}PLUGINS_"

DEFAULT_DOCS_DIR = Path("/srv/vdoc/docs/")
DEFAULT_API_USERNAME = b"admin"
DEFAULT_API_PASSWORD = b"admin"
DEFAULT_BIND_ADDRESS = "0.0.0.0"
DEFAULT_BIND_PORT = 8080

## PLUGIN CONSTANTS

# Theme plugin
PLUGIN_THEME_DEFAULT_LOGO_URL = AnyHttpUrl("https://logos.vorausrobotik.com/v_rgb.png")
PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL = AnyHttpUrl("https://logos.vorausrobotik.com/v_rgb.png")
