"""Contains all project model definitions."""

from __future__ import annotations

from functools import cached_property
from pathlib import Path
from typing import List

from packaging.version import InvalidVersion as PackagingInvalidVersion
from packaging.version import Version
from pydantic import BaseModel, field_validator

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
    def get_version_and_docs_path(cls, name: str, version: str) -> tuple[Version, Path]:
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

        if version == "latest":
            parsed_version = project.latest
        else:
            try:
                parsed_version = Version(version)
            except PackagingInvalidVersion as error:
                raise InvalidVersion(version=version) from error
            if parsed_version not in project.versions:
                raise ProjectVersionNotFound(name=name, version=parsed_version)

        return parsed_version, project._base_path / str(
            parsed_version
        )  # Path existence is validated at object construction

    @property
    def versions(self) -> List[Version]:
        """Returns a list of all available project versions.

        Raises:
            ProjectNotFound: If the project doesn't exist.

        Returns:
            A list of all versions of the project.
        """
        versions = self._base_path.glob("[!.]*")  # Path existence is validated at object construction
        return sorted([Version(path.name) for path in versions if path.is_dir()])

    @property
    def latest(self) -> Version:
        """Returns the latest version available of the project.

        Returns:
            _description_
        """
        return max(self.versions)
