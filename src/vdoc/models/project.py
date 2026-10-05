"""Contains all project model definitions."""

from __future__ import annotations

import shutil
from datetime import UTC, date, datetime
from functools import cached_property
from typing import TYPE_CHECKING

from packaging.version import InvalidVersion as PackagingInvalidVersion
from packaging.version import Version
from pydantic import BaseModel, ConfigDict, computed_field, field_validator
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError

from vdoc.constants import LATEST_VERSION_ALIAS
from vdoc.db import session
from vdoc.db.tables import ProjectRow, VersionRow
from vdoc.exceptions import CategoryNotFound, InvalidVersion, ProjectNotFound, ProjectVersionNotFound
from vdoc.models.project_visibility import ProjectVisibility
from vdoc.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Iterable
    from pathlib import Path

READABLE = (ProjectVisibility.LISTED, ProjectVisibility.UNLISTED)
"""The visibilities whose documentation can be read."""


class ProjectVersion(BaseModel):
    """A published version of a project."""

    model_config = ConfigDict(from_attributes=True)

    version: str
    """Spelled as it was published, which is also the name of its directory."""
    published_at: datetime

    @field_validator("published_at")
    @classmethod
    def naive_is_utc(cls, value: datetime) -> datetime:
        """Marks a time without a timezone as UTC.

        vdoc stores every time in UTC, but SQLite keeps no timezone, so a time read back from it has
        none. Left without one, a browser would read it as its own local time.

        Args:
            value: The time.

        Returns:
            The time, in UTC if it had no timezone.
        """
        return value if value.tzinfo else value.replace(tzinfo=UTC)


class Project(BaseModel):
    """A project and how it is presented.

    Every project and version is a row in the database. The documentation directory only holds the
    files of each version, at ``<name>/<version>/``.
    """

    model_config = ConfigDict(from_attributes=True)

    name: str
    display_name: str | None = None
    description: str | None = None
    """Plain text, shown with the project on the landing page."""
    category_id: int | None = None
    visibility: ProjectVisibility = ProjectVisibility.LISTED
    featured: bool = False
    """Whether the landing page offers to start with this project. At most one project is."""
    featured_label: str | None = None
    """The text of the button that starts with this project. Unset, the frontend words it itself."""

    @field_validator("display_name", "description", "featured_label")
    @classmethod
    def blank_is_unset(cls, value: str | None) -> str | None:
        """Treats a text that is only whitespace as not set.

        Args:
            value: The text.

        Returns:
            The stripped text, or None if nothing is left of it.
        """
        return (value or "").strip() or None

    @classmethod
    def get(cls, name: str, visibility: Iterable[ProjectVisibility] = READABLE) -> Project:
        """Returns a project.

        Args:
            name: The project name.
            visibility: The visibilities the project may have. By default, a locked project is not found.

        Raises:
            ProjectNotFound: If there is no such project with one of those visibilities.

        Returns:
            The project.
        """
        query = select(ProjectRow).where(ProjectRow.name == name, ProjectRow.visibility.in_(visibility))
        with session() as db:
            if (row := db.scalar(query)) is None:
                raise ProjectNotFound(name=name)
            return cls.model_validate(row)

    @classmethod
    def all(cls, visibility: Iterable[ProjectVisibility] = (ProjectVisibility.LISTED,)) -> list[Project]:
        """Returns every project with one of the given visibilities, sorted by name.

        Args:
            visibility: The visibilities to return. By default, only the listed projects.

        Returns:
            The projects.
        """
        query = select(ProjectRow).where(ProjectRow.visibility.in_(visibility)).order_by(ProjectRow.name)
        with session() as db:
            return [cls.model_validate(row) for row in db.scalars(query)]

    def save(self) -> None:
        """Stores how the project is presented.

        Featuring the project takes the mark off the one that had it, in the same transaction, so there
        is never a moment with two.

        Raises:
            ProjectNotFound: If the project doesn't exist.
            CategoryNotFound: If the category doesn't exist.
        """
        query = (
            update(ProjectRow)
            .where(ProjectRow.name == self.name)
            .values(**self.model_dump(exclude={"name"}, exclude_computed_fields=True))
        )
        with session() as db:
            if db.get(ProjectRow, self.name) is None:
                raise ProjectNotFound(name=self.name)
            try:
                if self.featured:
                    db.execute(update(ProjectRow).where(ProjectRow.name != self.name).values(featured=False))
                db.execute(query)
                db.commit()
            except IntegrityError as error:
                raise CategoryNotFound(category_id=self.category_id) from error

    @staticmethod
    def publish(name: str, version: str, published_at: datetime | None = None) -> None:
        """Records a published version, and the project if it is its first.

        Args:
            name: The project name.
            version: The version, spelled as its directory is named.
            published_at: When the version was published. Defaults to now.
        """
        with session() as db:
            if db.get(ProjectRow, name) is None:
                db.add(ProjectRow(name=name))
            db.add(VersionRow(project_name=name, version=version, published_at=published_at or datetime.now(UTC)))
            db.commit()

    @staticmethod
    def register_unrecorded() -> None:
        """Records every version in the documentation directory that the database does not know yet.

        This is what makes files that were put there by hand, or before there was a database, appear.
        It only ever adds: a version whose files are missing keeps its row, so an unmounted volume never
        costs the settings of every project.
        """
        with session() as db:
            recorded = {(row.project_name, row.version) for row in db.scalars(select(VersionRow))}

        for version_path in sorted(get_settings().docs_dir.glob("[!.]*/[!.]*")):
            name, version = version_path.parent.name, version_path.name
            if version_path.is_dir() and (name, version) not in recorded and _is_version(version):
                published_at = datetime.fromtimestamp(version_path.stat().st_mtime, tz=UTC)
                Project.publish(name=name, version=version, published_at=published_at)

    @computed_field  # type: ignore[prop-decorator]  # https://docs.pydantic.dev/2.0/usage/computed_fields/
    @cached_property
    def versions(self) -> list[ProjectVersion]:
        """Returns every published version, oldest first, so the newest is last.

        Sorted here rather than by the database, which cannot order version numbers.

        Returns:
            The published versions.
        """
        with session() as db:
            rows = db.scalars(select(VersionRow).where(VersionRow.project_name == self.name))
            versions = [ProjectVersion.model_validate(row) for row in rows]
        return sorted(versions, key=lambda published: Version(published.version))

    @property
    def latest(self) -> str:
        """Returns the newest published version.

        Returns:
            The newest version.
        """
        return self.versions[-1].version

    @property
    def latest_published_on(self) -> date:
        """Returns the day the newest published version appeared.

        Returns:
            The publication date of the newest version.
        """
        return self.versions[-1].published_at.date()

    def resolve(self, version: str) -> str:
        """Returns the published version a requested one names.

        Args:
            version: The requested version, or ``latest`` for the newest.

        Raises:
            InvalidVersion: If the version is of an invalid format.
            ProjectVersionNotFound: If the project doesn't have the requested version.

        Returns:
            The version, spelled as it was published.
        """
        if version == LATEST_VERSION_ALIAS:
            return self.latest
        try:
            requested = Version(version)
        except PackagingInvalidVersion as error:
            raise InvalidVersion(version=version) from error
        # Compared as normalized strings, because Version("1") == Version("1.0.0")
        for published in self.versions:
            if Version(published.version).public == requested.public:
                return published.version
        raise ProjectVersionNotFound(name=self.name, version=requested)

    @classmethod
    def get_version_and_docs_path(cls, name: str, version: str) -> tuple[str, Path]:
        """Returns the resolved version of a readable project and the directory of its files.

        Args:
            name: The project name.
            version: The project version, or ``latest`` for the newest.

        Returns:
            The resolved version and the directory holding it.
        """
        project = cls.get(name=name)
        resolved = project.resolve(version=version)
        return resolved, project.version_path(version=resolved)

    @classmethod
    def is_published(cls, name: str, version: str | None = None) -> bool:
        """Reports whether a project, and if given a version of it, can be read.

        Args:
            name: The project name.
            version: The project version, ``latest``, or None to ask only about the project.

        Returns:
            True if it can be read, False otherwise.
        """
        try:
            project = cls.get(name=name)
            if version is not None:
                project.resolve(version=version)
        except (ProjectNotFound, InvalidVersion, ProjectVersionNotFound):
            return False
        return True

    @property
    def title(self) -> str:
        """Returns the name a reader is shown: the display name if set, otherwise the project name.

        Returns:
            The project title.
        """
        return self.display_name or self.name

    @property
    def path(self) -> Path:
        """Returns the directory the versions of the project are published in.

        Returns:
            The project's directory.
        """
        return get_settings().docs_dir / self.name

    def version_path(self, version: str) -> Path:
        """Returns the directory the files of a published version are served from.

        Args:
            version: The version, spelled as it is published.

        Returns:
            The directory holding that version.
        """
        return self.path / version

    def delete_version(self, version: str) -> None:
        """Deletes a published version, files and all, and the project with its last version.

        The files go first. A version whose row went first would be recorded again from its files the
        next time vdoc starts, if deleting them failed.

        Args:
            version: The version, spelled exactly as it was published.

        Raises:
            ProjectVersionNotFound: If the project doesn't have that version.
        """
        if version not in {published.version for published in self.versions}:
            raise ProjectVersionNotFound(name=self.name, version=version)
        if len(self.versions) == 1:
            self.delete()
            return
        # Missing files are no reason to keep the version, they are what the registration leaves behind
        shutil.rmtree(self.version_path(version=version), ignore_errors=True)
        with session() as db:
            db.execute(delete(VersionRow).where(VersionRow.project_name == self.name, VersionRow.version == version))
            db.commit()

    def delete(self) -> None:
        """Deletes the project, with every version and all their files.

        The files go first, for the same reason as in ``delete_version``.
        """
        shutil.rmtree(self.path, ignore_errors=True)
        with session() as db:
            # Its versions go with it, by the foreign key
            db.execute(delete(ProjectRow).where(ProjectRow.name == self.name))
            db.commit()

    def latest_contains(self, file_name: str) -> bool:
        """Reports whether the newest published version ships a file.

        Args:
            file_name: The name of the file, relative to the version's root.

        Returns:
            True if the newest published version contains it, False otherwise.
        """
        return (self.version_path(version=self.latest) / file_name).is_file()


def _is_version(name: str) -> bool:
    """Reports whether a directory name is a version number.

    Args:
        name: The directory name.

    Returns:
        True if it parses as a version, False otherwise.
    """
    try:
        Version(name)
    except PackagingInvalidVersion:
        return False
    return True
