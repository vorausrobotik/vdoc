"""Contains all project model definitions."""

from __future__ import annotations

from dataclasses import dataclass
from functools import cached_property, lru_cache
from typing import TYPE_CHECKING

from packaging.version import InvalidVersion as PackagingInvalidVersion
from packaging.version import Version
from pydantic import BaseModel, computed_field, field_validator

from vdoc.constants import LATEST_VERSION_ALIAS
from vdoc.exceptions import InvalidVersion, ProjectNotFound, ProjectVersionNotFound
from vdoc.settings import get_settings

if TYPE_CHECKING:
    from pathlib import Path


@dataclass(frozen=True)
class _PublishedVersions:
    """What is published for one project, in each of the forms its readers ask for."""

    ordered: tuple[tuple[Version, str], ...]
    """Every version and the directory it is published under, oldest first, so the newest is last."""

    public_forms: frozenset[str]
    """The normalized form of each, to test a requested version against without walking them all."""


def _directory_generation(path: Path) -> int:
    """Returns a token that changes whenever an entry is added to a directory or removed from it.

    Args:
        path: The directory to read.

    Returns:
        The directory's modification time in nanoseconds.
    """
    return path.stat().st_mtime_ns


@lru_cache(maxsize=64)
def _scan_versions(project_path: Path, _generation: int) -> _PublishedVersions:
    """Reads the versions published for a project, once per state of its directory.

    Listing a project of two dozen versions costs a directory walk and a version parse per entry, and it
    is on the path of nearly every request. The generation makes this cache self-invalidating rather than
    something to remember to clear: the operating system bumps a directory's modification time when a
    version is added to it, which is a cache key that has never been seen, while the entry for the
    previous state ages out of the cache on its own.

    A version directory's own contents are deliberately not part of the generation, because an upload
    refuses to overwrite a version that already exists. What is published is only ever added to.

    Args:
        project_path: The path of the project.
        _generation: The state of the project directory the result belongs to. Unread: it exists to be
            part of the cache key.

    Returns:
        The published versions of the project.
    """
    parsed_versions = {Version(path.name): path.name for path in project_path.glob("[!.]*") if path.is_dir()}
    ordered = tuple(sorted(parsed_versions.items()))

    return _PublishedVersions(ordered=ordered, public_forms=frozenset(version.public for version, _ in ordered))


def invalidate_published_versions() -> None:
    """Drops what has been read about the published versions of every project.

    Call this after publishing or removing a version. The scan notices a change on its own too, but only
    as precisely as the filesystem timestamp it reads, and those are too coarse to tell two uploads that
    land in the same millisecond apart. Whoever writes knows exactly, so whoever writes says so.
    """
    _scan_versions.cache_clear()


def _published(project_path: Path) -> _PublishedVersions:
    """Returns the versions published for a project.

    Args:
        project_path: The path of the project.

    Returns:
        The published versions of the project.
    """
    return _scan_versions(project_path=project_path, _generation=_directory_generation(path=project_path))


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
        project_dir = get_settings().docs_dir / value
        if not project_dir.is_dir():
            raise ProjectNotFound(name=value)
        return value

    @cached_property
    def _base_path(self) -> Path:
        """Returns and caches the project's base path.

        Returns:
            The project's base path.
        """
        return get_settings().docs_dir / self.name

    @classmethod
    def list(cls, search_path: Path | None = None) -> list[Project]:
        """Returns a list of all projects.

        Args:
            search_path: Optional search path. If None, the docs_dir of the settings will be used.

        Returns:
            A a list of all projects.
        """
        search_path = search_path or get_settings().docs_dir
        paths = search_path.glob("[!.]*")
        projects = [Project(name=path.name) for path in paths if path.is_dir()]

        return sorted(projects, key=lambda project: project.name)

    @classmethod
    def is_published(cls, name: str, version: str | None = None) -> bool:
        """Reports whether a project, and if given a version of it, is published.

        Answers what ``get_version_and_docs_path`` answers, as a bool rather than as an exception, and
        without building a ``Project`` for it. This is asked on every request the web UI serves, where
        validating a model per request buys nothing.

        Args:
            name: The project name.
            version: The project version, ``latest``, or None to ask only about the project.

        Returns:
            True if it is published, False otherwise.
        """
        project_path = get_settings().docs_dir / name
        if not project_path.is_dir():
            return False
        if version is None:
            return True

        published = _published(project_path=project_path)
        if version == LATEST_VERSION_ALIAS:
            return bool(published.ordered)

        try:
            parsed_version = Version(version)
        except PackagingInvalidVersion:
            return False

        # Compared as normalized strings for the same reason as in get_version_and_docs_path
        return parsed_version.public in published.public_forms

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

        if version == LATEST_VERSION_ALIAS:
            return_version = project.latest
        else:
            try:
                parsed_version = Version(version)
                return_version = version
            except PackagingInvalidVersion as error:
                raise InvalidVersion(version=version) from error
            # Version("1") == Version("1.0.0") validates to True, comparing the plain public string mitigates this issue
            if parsed_version.public not in _published(project_path=project._base_path).public_forms:
                raise ProjectVersionNotFound(name=name, version=parsed_version)

        return return_version, project._base_path / return_version  # Path existence is validated at object construction

    @computed_field  # type: ignore[prop-decorator]  # https://docs.pydantic.dev/2.0/usage/computed_fields/
    @cached_property
    def display_name(self) -> str:
        """Returns the display name of the project if configured, otherwise the project name.

        Returns:
            str: The project display name.
        """
        return get_settings().project_display_name_mapping.get(self.name, self.name)

    @computed_field  # type: ignore[prop-decorator]  # https://docs.pydantic.dev/2.0/usage/computed_fields/
    @cached_property
    def category_id(self) -> int | None:
        """Returns the category ID of the project if configured, otherwise None.

        Returns:
            int | None: The optional project category ID.
        """
        settings = get_settings()
        if category_name := settings.project_category_mapping.get(self.name):
            return next(category.id for category in settings.project_categories if category.name == category_name)
        return None

    @property
    def versions(self) -> dict[Version, str]:
        """Returns a list of all available project versions.

        Raises:
            ProjectNotFound: If the project doesn't exist.

        Returns:
            A list of all versions of the project.
        """
        # Path existence is validated at object construction
        return dict(_published(project_path=self._base_path).ordered)

    @property
    def latest(self) -> str:
        """Returns the latest version available of the project.

        Returns:
            _description_
        """
        return _published(project_path=self._base_path).ordered[-1][1]
