"""Contains the settings definition."""

from functools import lru_cache
from pathlib import Path
from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict
from sqlalchemy import make_url

from vdoc.config_file import ConfigFileSettingsSource
from vdoc.constants import (
    CONFIG_ENV_PREFIX,
    CONFIG_FILE_SECTION_VDOC,
    DEFAULT_API_PASSWORD,
    DEFAULT_API_USERNAME,
    DEFAULT_BIND_ADDRESS,
    DEFAULT_BIND_PORT,
    DEFAULT_DATABASE_URL,
    DEFAULT_DOCS_DIR,
)


class VDocSettings(BaseSettings):
    """The vdoc settings."""

    # Frozen because `get_settings` hands the same instance to every caller
    model_config = SettingsConfigDict(env_prefix=CONFIG_ENV_PREFIX, env_parse_none_str="None", frozen=True)

    docs_dir: Path = DEFAULT_DOCS_DIR
    api_username: bytes = DEFAULT_API_USERNAME
    api_password: bytes = DEFAULT_API_PASSWORD
    bind_address: str = DEFAULT_BIND_ADDRESS
    bind_port: int = DEFAULT_BIND_PORT
    database_url: str = DEFAULT_DATABASE_URL

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Adds the configuration file as the lowest priority source.

        Last in the tuple, so an environment variable still wins over the file. Adding a way to
        configure vdoc must not change what an existing deployment resolves to.

        Args:
            settings_cls: The settings class being built.
            init_settings: Values passed to the constructor.
            env_settings: Values from the environment.
            dotenv_settings: Values from a dotenv file.
            file_secret_settings: Values from a secrets directory.

        Returns:
            The sources to read, highest priority first.
        """
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            file_secret_settings,
            ConfigFileSettingsSource(settings_cls, section=CONFIG_FILE_SECTION_VDOC),
        )

    @property
    def uses_default_credentials(self) -> bool:
        """Reports whether the API credentials are still the published defaults.

        Returns:
            True if both the username and the password are the defaults, False otherwise.
        """
        return self.api_username == DEFAULT_API_USERNAME and self.api_password == DEFAULT_API_PASSWORD

    @model_validator(mode="after")
    def validate_database_outside_docs_dir(self) -> Self:
        """Ensures that the database file is not inside the documentation directory.

        Everything in the documentation directory is served as a static file, so a database placed
        there could be downloaded by anyone.

        Raises:
            ValueError: If the database file is inside the documentation directory.

        Returns:
            Self: The validated model.
        """
        url = make_url(self.database_url)
        if url.get_backend_name() == "sqlite" and url.database:
            database_path = Path(url.database).resolve()
            if database_path.is_relative_to(self.docs_dir.resolve()):
                msg = f"The database '{database_path}' must not be inside the documentation directory"
                raise ValueError(msg)

        return self


@lru_cache(maxsize=1)
def get_settings() -> VDocSettings:
    """Returns the settings, reading the environment and the configuration file only once.

    Prefer this over constructing ``VDocSettings`` directly. Building the model validates it and parses
    the configuration file, which together cost most of a millisecond -- significant for something read
    several times per request -- and there is nothing to re-read: vdoc is deployed as a container with a
    fixed environment and a mounted file, so its configuration cannot change without the process being
    replaced.

    The returned instance is shared and frozen, so it is safe to hold on to but not to modify. A test
    that changes the environment has to call ``get_settings.cache_clear()``, which the test suite does
    around every test.

    Returns:
        The settings.
    """
    return VDocSettings()
