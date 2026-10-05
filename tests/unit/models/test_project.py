"""Contains all tests for the project models."""

import shutil
from datetime import UTC, datetime
from pathlib import Path

import pytest
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from tests.conftest import DUMMY_DOCS_STRUCTURE
from vdoc.db import session
from vdoc.db.tables import ProjectRow
from vdoc.exceptions import CategoryNotFound, InvalidVersion, ProjectNotFound, ProjectVersionNotFound
from vdoc.models.project import Project
from vdoc.models.project_category import ProjectCategory
from vdoc.models.project_visibility import ProjectVisibility


def test_project_defaults(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    project = Project.get(name="dummy-project-01")

    assert project == Project(name="dummy-project-01")
    assert project.title == "dummy-project-01"
    assert project.visibility is ProjectVisibility.LISTED


def test_project_save(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    category = ProjectCategory.create(name="General")
    Project(name="dummy-project-01", display_name="One", description="  ", category_id=category.id).save()

    project = Project.get(name="dummy-project-01")
    assert project.title == "One"
    assert project.description is None, "A blank text is stored as not set"
    assert project.category_id == category.id


def test_project_save_unknown_category(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    with pytest.raises(CategoryNotFound):
        Project(name="dummy-project-01", category_id=42).save()


def test_featuring_a_project_takes_the_mark_off_the_other(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", featured=True).save()
    Project(name="dummy-project-02", featured=True).save()

    assert Project.get(name="dummy-project-01").featured is False
    assert Project.get(name="dummy-project-02").featured is True


def test_a_blank_featured_label_is_unset(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    """Unset, the button falls back to its own wording rather than showing an empty label."""
    Project(name="dummy-project-01", featured=True, featured_label="  ").save()

    assert Project.get(name="dummy-project-01").featured_label is None


def test_the_database_holds_at_most_one_featured_project(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    """The rule holds below the model too, for any writer that skips ``save``."""
    with session() as db, pytest.raises(IntegrityError):
        db.execute(update(ProjectRow).values(featured=True))


def test_project_category_deleted(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    """Deleting a category moves its projects out of it rather than failing or deleting them."""
    category = ProjectCategory.create(name="General")
    Project(name="dummy-project-01", category_id=category.id).save()
    ProjectCategory.delete(category_id=category.id)

    assert Project.get(name="dummy-project-01").category_id is None


def test_project_not_found(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    with pytest.raises(ProjectNotFound):
        Project.get(name="not-a-project")


def test_locked_project(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", visibility=ProjectVisibility.LOCKED).save()

    with pytest.raises(ProjectNotFound):
        Project.get(name="dummy-project-01")
    assert Project.get(name="dummy-project-01", visibility=ProjectVisibility).visibility is ProjectVisibility.LOCKED
    assert not Project.is_published(name="dummy-project-01", version="1.0.0")


def test_all_projects_by_visibility(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", visibility=ProjectVisibility.UNLISTED).save()
    Project(name="dummy-project-02", visibility=ProjectVisibility.LOCKED).save()

    assert [project.name for project in Project.all()] == ["dummy-project-03"]
    assert [project.name for project in Project.all(visibility=ProjectVisibility)] == list(DUMMY_DOCS_STRUCTURE)
    # Unlisted is only left out of listings, it is still readable
    assert Project.is_published(name="dummy-project-01", version="1.0.0")


def test_all_projects_by_title(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", display_name="Zebra").save()
    Project(name="dummy-project-02", display_name="alpha").save()

    assert [project.title for project in Project.all(visibility=ProjectVisibility)] == [
        "alpha",
        "dummy-project-03",
        "Zebra",
    ]


def test_list_project_versions(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    assert [published.version for published in Project(name="dummy-project-03").versions] == [
        "1.0.0",
        "1.3.0",
        "2.0.0-beta",
    ]


def test_get_project_latest_version(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    assert Project(name="dummy-project-03").latest == "2.0.0-beta"


def test_register_unrecorded(dummy_projects_dir: Path) -> None:
    """Only version directories become versions, and registering again adds nothing twice."""
    (dummy_projects_dir / "empty-project").mkdir()
    (dummy_projects_dir / "dummy-project-01" / "not-a-version").mkdir()
    (dummy_projects_dir / "dummy-project-01" / "3.0.0").mkdir()

    Project.register_unrecorded()

    assert Project.all() == [Project(name=project_name) for project_name in DUMMY_DOCS_STRUCTURE]
    assert Project(name="dummy-project-01").latest == "3.0.0"


def test_register_unrecorded_keeps_versions_without_files(dummy_projects_dir: Path) -> None:
    """An unmounted volume must not cost the settings of every project."""
    Project(name="dummy-project-01", display_name="One").save()
    shutil.rmtree(dummy_projects_dir / "dummy-project-01")

    Project.register_unrecorded()

    assert Project.get(name="dummy-project-01").title == "One"


def test_project_equality_survives_its_caches(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    """What a project has been asked must not change what makes it the same project."""
    read, untouched = Project(name="dummy-project-01"), Project(name="dummy-project-01")
    _ = read.latest, read.versions, read.display_name

    assert read == untouched


def test_project_version_path(dummy_projects_dir: Path) -> None:
    project = Project(name="dummy-project-01")

    assert project.version_path(version="1.1.0") == dummy_projects_dir / "dummy-project-01" / "1.1.0"


def test_project_latest_contains(dummy_projects_dir: Path) -> None:
    project = Project(name="dummy-project-01")
    (dummy_projects_dir / "dummy-project-01" / "1.1.0" / "objects.inv").write_text("only in a superseded version")

    assert project.latest_contains("index.html")
    assert not project.latest_contains("objects.inv")


def test_project_latest_published_on(dummy_projects_dir: Path) -> None:
    published_on = datetime.fromtimestamp(
        (dummy_projects_dir / "dummy-project-01" / "2.0.0").stat().st_mtime, tz=UTC
    ).date()

    assert Project(name="dummy-project-01").latest_published_on == published_on


def test_get_version_and_docs_path(dummy_projects_dir: Path) -> None:
    assert ("1.0.0", dummy_projects_dir / "dummy-project-01" / "1.0.0") == Project.get_version_and_docs_path(
        name="dummy-project-01", version="1.0.0"
    )


def test_get_version_and_docs_path_latest(dummy_projects_dir: Path) -> None:
    assert ("2.0.0", dummy_projects_dir / "dummy-project-01" / "2.0.0") == Project.get_version_and_docs_path(
        name="dummy-project-01", version="latest"
    )


def test_get_version_and_docs_path_invalid_version(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    with pytest.raises(InvalidVersion):
        Project.get_version_and_docs_path(name="dummy-project-01", version="abc")


def test_get_version_and_docs_path_incomplete_version(
    dummy_projects_dir: Path,  # noqa: ARG001
) -> None:
    with pytest.raises(ProjectVersionNotFound):
        Project.get_version_and_docs_path(name="dummy-project-01", version="1")


def test_project_version_published_at_is_utc(dummy_projects_dir: Path) -> None:  # noqa: ARG001
    """A time without a timezone would be read by a browser as its own local time."""
    assert Project.get(name="dummy-project-01").versions[0].published_at.tzinfo is UTC


def test_delete_version_without_files(dummy_projects_dir: Path) -> None:
    """The registration keeps a version whose files are gone, so deleting it must not need them."""
    shutil.rmtree(dummy_projects_dir / "dummy-project-01" / "2.0.0")

    Project.get(name="dummy-project-01").delete_version(version="2.0.0")

    assert Project.get(name="dummy-project-01").latest == "1.1.0"
