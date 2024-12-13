"""Contains all unit tests for the projects REST API."""

from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from packaging.version import Version

from vdoc.exceptions import ProjectVersionNotFound
from vdoc.models.project import Project


@patch("vdoc.api.routes.projects.list_projects_impl")
def test_list_projects_route(list_projects_impl_mock: MagicMock, dummy_projects_dir: Path, api: TestClient) -> None:
    mocked_projects = Project.list(search_path=dummy_projects_dir)
    list_projects_impl_mock.return_value = mocked_projects
    response = api.get("/api/projects/")
    assert response.json() == [{"name": "dummy-project-01"}, {"name": "dummy-project-02"}, {"name": "dummy-project-03"}]
    list_projects_impl_mock.assert_called_once_with()


@patch("vdoc.api.routes.projects.list_project_versions_impl")
def test_get_project_versions_route(list_project_versions_impl_mock: MagicMock, api: TestClient) -> None:
    mocked_versions = ["1", "2", "3", "4"]
    list_project_versions_impl_mock.return_value = mocked_versions
    response = api.get("/api/projects/foo/versions")
    assert response.json() == mocked_versions
    list_project_versions_impl_mock.assert_called_once_with(name="foo")


@patch("vdoc.api.routes.projects.get_project_version_and_latest_version_impl")
def test_get_project_version_route(
    get_project_version_and_latest_version_impl_mock: MagicMock, api: TestClient
) -> None:
    get_project_version_and_latest_version_impl_mock.side_effect = ProjectVersionNotFound(
        name="foo", version=Version("42")
    )
    response = api.get("/api/projects/foo/versions/42")
    assert response.status_code == 404
    assert response.json() == {
        "message": "Project 'foo' doesn't have a documentation for version '42'.",
    }
