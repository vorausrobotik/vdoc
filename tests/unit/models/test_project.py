"""Contains all tests for the project models."""

from pathlib import Path

from packaging.version import Version

from tests.conftest import DUMMY_DOCS_STRUCTURE
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
