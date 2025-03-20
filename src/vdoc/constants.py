"""Contains all constant values."""

from pathlib import Path

CONFIG_ENV_PREFIX = "VDOC_"

DEFAULT_DOCS_DIR = Path("/srv/vdoc/docs/")
DEFAULT_API_USERNAME = b"admin"
DEFAULT_API_PASSWORD = b"admin"
DEFAULT_BIND_ADDRESS = "0.0.0.0"
DEFAULT_BIND_PORT = 8080

DEFAULT_LOGO_DARK_URL = "https://logos.vorausrobotik.com/v_rgb.png"
DEFAULT_LOGO_LIGHT_URL = "https://logos.vorausrobotik.com/v_rgb.png"
