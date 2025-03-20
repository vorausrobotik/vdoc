"""Contains the settings definition."""

from pathlib import Path
from typing import Self

from pydantic import model_validator
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

    logo_dark_url: str | None = DEFAULT_LOGO_DARK_URL
    logo_light_url: str | None = DEFAULT_LOGO_LIGHT_URL
    project_categories: list[ProjectCategory] = []
    project_category_mapping: dict[str, str] = {}

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
        project_category_ids = list(map(lambda category: category.id, self.project_categories))
        project_category_names = list(map(lambda category: category.name, self.project_categories))
        if len(set(project_category_ids)) != len(project_category_ids):
            raise ValueError("Duplicate category IDs are not allowed in `project_categories`")
        if len(set(project_category_names)) != len(project_category_names):
            raise ValueError("Duplicate category names are not allowed in `project_categories`")
        for category_name in self.project_category_mapping.values():
            if category_name not in project_category_names:
                raise ValueError(
                    f"Category name '{category_name}' in `project_category_mapping` is "
                    "not defined in `project_categories`"
                )

        return self
