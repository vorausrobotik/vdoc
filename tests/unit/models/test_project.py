"""Contains all tests for the project models."""

from pathlib import Path

import pytest
from packaging.version import Version

from tests.conftest import DUMMY_DOCS_STRUCTURE
from vdoc.exceptions import InvalidVersion, ProjectVersionNotFound
from vdoc.models.project import Project


def test_list_projects(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    projects = Project.list()
    assert projects == [Project(name=project_name) for project_name in DUMMY_DOCS_STRUCTURE]


def test_list_project_versions(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert Project(name="dummy-project-01").versions == [
        Version("0.0.1"),
        Version("0.0.2"),
        Version("0.1.0"),
        Version("1.0.0"),
        Version("1.1.0"),
        Version("2.0.0"),
    ]


def test_get_project_latest_version(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert Project(name="dummy-project-02").latest == Version("6.0.0")


def test_get_version_and_docs_path(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert (Version("1.0.0"), dummy_projects_dir / "dummy-project-01" / "1.0.0") == Project.get_version_and_docs_path(
        name="dummy-project-01", version="1.0.0"
    )


def test_get_version_and_docs_path_latest(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert (Version("2.0.0"), dummy_projects_dir / "dummy-project-01" / "2.0.0") == Project.get_version_and_docs_path(
        name="dummy-project-01", version="latest"
    )


def test_get_version_and_docs_path_invalid_version(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    with pytest.raises(InvalidVersion):
        Project.get_version_and_docs_path(name="dummy-project-01", version="abc")


def test_get_version_and_docs_path_incomplete_version(
    dummy_projects_dir: Path,  # pylint: disable=unused-argument
) -> None:
    with pytest.raises(ProjectVersionNotFound):
        Project.get_version_and_docs_path(name="dummy-project-01", version="1")
