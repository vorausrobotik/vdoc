"""Contains the settings definition."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class VDocSettings(BaseSettings):
    """The vdoc settings."""

    model_config = SettingsConfigDict(env_prefix="VDOC_")

    docs_dir: Path = Path("/srv/vdoc/docs/")
