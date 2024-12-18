"""Contains the settings definition."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from vdoc.constants import CONFIG_ENV_PREFIX, DEFAULT_DOCS_DIR


class VDocSettings(BaseSettings):
    """The vdoc settings."""

    model_config = SettingsConfigDict(env_prefix=CONFIG_ENV_PREFIX)

    docs_dir: Path = DEFAULT_DOCS_DIR
