"""Contains all tests for the project models."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
from packaging.version import Version

from tests.conftest import DUMMY_DOCS_STRUCTURE
from vdoc.exceptions import InvalidVersion, ProjectVersionNotFound
from vdoc.models.project import Project


@patch.dict(os.environ, {"VDOC_PROJECT_DISPLAY_NAME_MAPPING": '{"dummy-project-01": "Dummy Project 01"}'})
def test_project_display_name(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert Project(name="dummy-project-01").display_name == "Dummy Project 01"
    assert Project(name="dummy-project-02").display_name == "dummy-project-02"


@patch.dict(
    os.environ,
    {
        "VDOC_PROJECT_CATEGORIES": '[{"id": 1, "name": "General"}, {"id": 2, "name": "API"}]',
        "VDOC_PROJECT_CATEGORY_MAPPING": '{"dummy-project-01": "API"}',
    },
)
def test_project_category(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert Project(name="dummy-project-01").category_id == 2
    assert Project(name="dummy-project-02").category_id is None


def test_list_projects(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    projects = Project.list()
    assert projects == [Project(name=project_name) for project_name in DUMMY_DOCS_STRUCTURE]


def test_list_project_versions(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert Project(name="dummy-project-03").versions == {
        Version("1.0.0"): "1.0.0",
        Version("1.3.0"): "1.3.0",
        Version("2.0.0-b0"): "2.0.0-beta",
    }


def test_get_project_latest_version(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert Project(name="dummy-project-03").latest == "2.0.0-beta"


def test_get_version_and_docs_path(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert ("1.0.0", dummy_projects_dir / "dummy-project-01" / "1.0.0") == Project.get_version_and_docs_path(
        name="dummy-project-01", version="1.0.0"
    )


def test_get_version_and_docs_path_latest(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert ("2.0.0", dummy_projects_dir / "dummy-project-01" / "2.0.0") == Project.get_version_and_docs_path(
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
