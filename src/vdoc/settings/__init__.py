"""Contains the settings definition."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from vdoc.constants import (
    CONFIG_ENV_PREFIX,
    DEFAULT_API_PASSWORD,
    DEFAULT_API_USERNAME,
    DEFAULT_BIND_ADDRESS,
    DEFAULT_BIND_PORT,
    DEFAULT_DOCS_DIR,
)


class VDocSettings(BaseSettings):
    """The vdoc settings."""

    model_config = SettingsConfigDict(env_prefix=CONFIG_ENV_PREFIX)

    docs_dir: Path = DEFAULT_DOCS_DIR
    api_username: bytes = DEFAULT_API_USERNAME
    api_password: bytes = DEFAULT_API_PASSWORD
    bind_address: str = DEFAULT_BIND_ADDRESS
    bind_port: int = DEFAULT_BIND_PORT
