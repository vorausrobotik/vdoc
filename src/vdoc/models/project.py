"""Contains all project model definitions."""

from __future__ import annotations

from functools import cached_property
from pathlib import Path
from typing import Dict

from packaging.version import InvalidVersion as PackagingInvalidVersion
from packaging.version import Version
from pydantic import BaseModel, computed_field, field_validator

from vdoc.exceptions import InvalidVersion, ProjectNotFound, ProjectVersionNotFound
from vdoc.settings import VDocSettings


class Project(BaseModel):
    """Pydantic model for a project."""

    name: str

    @field_validator("name")
    @classmethod
    def validate_project_exists(cls, value: str) -> str:
        """Validates the project's existence.

        Args:
            value: The project name.

        Raises:
            ProjectNotFound: If the project doesn't exist.

        Returns:
            The validated project name.
        """
        settings = VDocSettings()
        project_dir = settings.docs_dir / value
        if not project_dir.is_dir():
            raise ProjectNotFound(name=value)
        return value

    @cached_property
    def _base_path(self) -> Path:
        """Returns and caches the project's base path.

        Returns:
            The project's base path.
        """
        settings = VDocSettings()
        return settings.docs_dir / self.name

    @classmethod
    def list(cls, search_path: Path | None = None) -> list[Project]:
        """Returns a list of all projects.

        Args:
            search_path: Optional search path. If None, the docs_dir of the settings will be used.

        Returns:
            A a list of all projects.
        """
        search_path = search_path or VDocSettings().docs_dir
        paths = search_path.glob("[!.]*")
        projects = [Project(name=path.name) for path in paths if path.is_dir()]

        return sorted(projects, key=lambda project: project.name)

    @classmethod
    def get_version_and_docs_path(cls, name: str, version: str) -> tuple[str, Path]:
        """Returns the validated version and the path containing the documentation.

        Args:
            name: The project name.
            version: The project version. If ``latest``, the path to the newest version will be returned.

        Raises:
            ProjectNotFound: If the project doesn't exist.
            InvalidVersion: If the version is of an invalid format.
            ProjectVersionNotFound: If the project doesn't have the requested version.

        Returns:
            The validated version and the path containing the documentation.
        """
        project = Project(name=name)
        return_version: str

        if version == "latest":
            return_version = project.latest
        else:
            try:
                parsed_version = Version(version)
                return_version = version
            except PackagingInvalidVersion as error:
                raise InvalidVersion(version=version) from error
            # Version("1") == Version("1.0.0") validates to True, comparing the plain public string mitigates this issue
            if parsed_version.public not in map(lambda version: version.public, project.versions):
                raise ProjectVersionNotFound(name=name, version=parsed_version)

        return return_version, project._base_path / return_version  # Path existence is validated at object construction

    @computed_field  # type: ignore[prop-decorator]  # https://docs.pydantic.dev/2.0/usage/computed_fields/
    @cached_property
    def display_name(self) -> str:
        """Returns the display name of the project if configured, otherwise the project name.

        Returns:
            str: The project display name.
        """
        settings = VDocSettings()
        return settings.project_display_name_mapping.get(self.name, self.name)

    @computed_field  # type: ignore[prop-decorator]  # https://docs.pydantic.dev/2.0/usage/computed_fields/
    @cached_property
    def category_id(self) -> int | None:
        """Returns the category ID of the project if configured, otherwise None.

        Returns:
            int | None: The optional project category ID.
        """
        settings = VDocSettings()
        if category_name := settings.project_category_mapping.get(self.name):
            return next(category.id for category in settings.project_categories if category.name == category_name)
        return None

    @property
    def versions(self) -> Dict[Version, str]:
        """Returns a list of all available project versions.

        Raises:
            ProjectNotFound: If the project doesn't exist.

        Returns:
            A list of all versions of the project.
        """
        versions = self._base_path.glob("[!.]*")  # Path existence is validated at object construction
        parsed_versions: Dict[Version, str] = {}
        for path in versions:
            if not path.is_dir():
                continue
            parsed_versions[Version(path.name)] = path.name

        return dict(sorted(parsed_versions.items()))

    @property
    def latest(self) -> str:
        """Returns the latest version available of the project.

        Returns:
            _description_
        """
        return self.versions[max(self.versions.keys())]
