"""Contains the settings definition."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

from vdoc.constants import (
    CONFIG_ENV_PREFIX,
    DEFAULT_API_PASSWORD,
    DEFAULT_API_USERNAME,
    DEFAULT_BIND_ADDRESS,
    DEFAULT_BIND_PORT,
    DEFAULT_DOCS_DIR,
    DEFAULT_LOGO_DARK_URL,
    DEFAULT_LOGO_LIGHT_URL,
)


class VDocSettings(BaseSettings):
    """The vdoc settings."""

    model_config = SettingsConfigDict(env_prefix=CONFIG_ENV_PREFIX, env_parse_none_str="None")

    docs_dir: Path = DEFAULT_DOCS_DIR
    api_username: bytes = DEFAULT_API_USERNAME
    api_password: bytes = DEFAULT_API_PASSWORD
    bind_address: str = DEFAULT_BIND_ADDRESS
    bind_port: int = DEFAULT_BIND_PORT

    project_display_name_mapping: dict[str, str] = {}

    logo_dark_url: Optional[str] = DEFAULT_LOGO_DARK_URL
    logo_light_url: Optional[str] = DEFAULT_LOGO_LIGHT_URL
