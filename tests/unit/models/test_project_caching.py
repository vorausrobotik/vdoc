"""Contains all tests for how the published versions of a project are cached."""

from pathlib import Path

from fastapi.testclient import TestClient

from vdoc.models.project import Project
from vdoc.settings import get_settings


def test_the_settings_are_built_once() -> None:
    """Read several times per request, so building them per read is waste that adds up."""
    assert get_settings() is get_settings()


def test_a_version_added_to_a_project_is_seen(dummy_projects_dir: Path) -> None:
    """The scan is cached, so it has to notice that a project gained a version."""
    project = Project(name="dummy-project-01")
    assert project.latest == "2.0.0"

    (dummy_projects_dir / "dummy-project-01" / "3.0.0").mkdir()

    assert Project(name="dummy-project-01").latest == "3.0.0"


def test_a_version_removed_from_a_project_is_seen(dummy_projects_dir: Path) -> None:
    assert Project(name="dummy-project-01").latest == "2.0.0"

    (dummy_projects_dir / "dummy-project-01" / "2.0.0" / "index.html").unlink()
    (dummy_projects_dir / "dummy-project-01" / "2.0.0").rmdir()

    assert Project(name="dummy-project-01").latest == "1.1.0"


def test_an_upload_is_visible_immediately(
    dummy_projects_dir: Path,  # noqa: ARG001
    authenticated_api: TestClient,
    example_docs_zip: Path,
) -> None:
    """A version published while vdoc runs must not wait for a cache to notice it."""
    assert Project(name="dummy-project-01").latest == "2.0.0"

    response = authenticated_api.post(
        "/api/projects/dummy-project-01/versions/3.0.0",
        files={"file": ("docs.zip", example_docs_zip.read_bytes(), "application/zip")},
    )
    assert response.status_code == 201

    assert Project(name="dummy-project-01").latest == "3.0.0"
    assert authenticated_api.get("/api/projects/dummy-project-01/versions/latest").json() == "3.0.0"
