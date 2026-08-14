"""Contains the settings definition."""

from pathlib import Path
from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict

from vdoc.config_file import ConfigFileSettingsSource
from vdoc.constants import (
    CONFIG_ENV_PREFIX,
    CONFIG_FILE_SECTION_VDOC,
    DEFAULT_API_PASSWORD,
    DEFAULT_API_USERNAME,
    DEFAULT_BIND_ADDRESS,
    DEFAULT_BIND_PORT,
    DEFAULT_DOCS_DIR,
)
from vdoc.models.project_category import ProjectCategory


class VDocSettings(BaseSettings):
    """The vdoc settings."""

    model_config = SettingsConfigDict(env_prefix=CONFIG_ENV_PREFIX, env_parse_none_str="None")

    docs_dir: Path = DEFAULT_DOCS_DIR
    api_username: bytes = DEFAULT_API_USERNAME
    api_password: bytes = DEFAULT_API_PASSWORD
    bind_address: str = DEFAULT_BIND_ADDRESS
    bind_port: int = DEFAULT_BIND_PORT

    project_display_name_mapping: dict[str, str] = {}

    project_categories: list[ProjectCategory] = []
    project_category_mapping: dict[str, str] = {}

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

    @model_validator(mode="after")
    def validate_model(self) -> Self:
        """Validates the model.

        The following checks are performed:

        - Ensures that all category IDs in `project_categories` are unique.
        - Ensures that all category names in `project_categories` are unique.
        - Ensures that all categories in `project_category_mapping` are defined in `project_categories`.

        Raises:
            ValueError: If any check fails.

        Returns:
            Self: The validated model.
        """
        project_category_ids = [category.id for category in self.project_categories]
        project_category_names = [category.name for category in self.project_categories]
        if len(set(project_category_ids)) != len(project_category_ids):
            msg = "Duplicate category IDs are not allowed in `project_categories`"
            raise ValueError(msg)
        if len(set(project_category_names)) != len(project_category_names):
            msg = "Duplicate category names are not allowed in `project_categories`"
            raise ValueError(msg)
        for category_name in self.project_category_mapping.values():
            if category_name not in project_category_names:
                msg = (
                    f"Category name '{category_name}' in `project_category_mapping` is "
                    "not defined in `project_categories`"
                )
                raise ValueError(msg)

        return self
