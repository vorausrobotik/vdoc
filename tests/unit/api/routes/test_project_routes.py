"""Contains all unit tests for the projects REST API."""

import os
import zipfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from packaging.version import Version

from tests.utils import assert_api_response, ensure_project_dir_not_created
from vdoc.exceptions import ProjectVersionNotFound
from vdoc.models.project import Project


@patch.dict(
    os.environ,
    {
        "VDOC_PROJECT_DISPLAY_NAME_MAPPING": '{"dummy-project-01": "Dummy Project 01"}',
        "VDOC_PROJECT_CATEGORIES": '[{"id": 1, "name": "General"}]',
        "VDOC_PROJECT_CATEGORY_MAPPING": '{"dummy-project-01": "General"}',
    },
)
@patch("vdoc.api.routes.projects.list_projects_impl")
def test_list_projects_route(list_projects_impl_mock: MagicMock, dummy_projects_dir: Path, api: TestClient) -> None:
    mocked_projects = Project.list(search_path=dummy_projects_dir)
    list_projects_impl_mock.return_value = mocked_projects
    response = api.get("/api/projects/")
    assert response.json() == [
        {"name": "dummy-project-01", "display_name": "Dummy Project 01", "category_id": 1},
        {"name": "dummy-project-02", "display_name": "dummy-project-02", "category_id": None},
        {"name": "dummy-project-03", "display_name": "dummy-project-03", "category_id": None},
    ]
    list_projects_impl_mock.assert_called_once_with()


@patch("vdoc.api.routes.projects.list_project_versions_impl")
def test_get_project_versions_route(list_project_versions_impl_mock: MagicMock, api: TestClient) -> None:
    mocked_versions = ["1", "2", "3", "4"]
    list_project_versions_impl_mock.return_value = mocked_versions
    response = api.get("/api/projects/foo/versions/")
    assert response.json() == mocked_versions
    list_project_versions_impl_mock.assert_called_once_with(name="foo")


@patch("vdoc.api.routes.projects.get_project_version_impl")
def test_get_project_version_route(get_project_version_impl_mock: MagicMock, api: TestClient) -> None:
    get_project_version_impl_mock.side_effect = ProjectVersionNotFound(name="foo", version=Version("42"))
    response = api.get("/api/projects/foo/versions/42")
    assert_api_response(
        response=response, status_code=404, message="Project 'foo' doesn't have a documentation for version '42'."
    )


def test_upload_project_version_route_unauthenticated(api: TestClient, example_docs_zip: Path) -> None:
    response = api.post(
        "/api/projects/dummy-project-01/versions/1.0.0",
        files={"file": (example_docs_zip.name, example_docs_zip.read_bytes(), "application/zip")},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_upload_project_version_route(
    dummy_projects_dir: Path, authenticated_api: TestClient, example_docs_zip: Path
) -> None:
    project_version_dir = dummy_projects_dir / "dummy-project-01" / "3.0.0"
    assert not project_version_dir.is_dir()
    response = authenticated_api.post(
        "/api/projects/dummy-project-01/versions/3.0.0",
        files={"file": (example_docs_zip.name, example_docs_zip.read_bytes(), "application/zip")},
    )
    assert_api_response(
        response=response,
        status_code=201,
        message="Version '3.0.0' of project 'dummy-project-01' uploaded successfully.",
    )
    assert (project_version_dir).is_dir()
    index_file = project_version_dir / "index.html"
    assert index_file.is_file()
    assert index_file.read_text() == "<html><body>Test File</body></html>"


def test_upload_project_version_route_invalid_version(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:
    with ensure_project_dir_not_created(dummy_projects_dir, "dummy-project-01", "3.0.0"):
        response = authenticated_api.post(
            "/api/projects/dummy-project-01/versions/abcd", files={"file": ("foo", b"", "application/zip")}
        )
        assert_api_response(
            response=response,
            status_code=400,
            message="'abcd' is not a valid version identifier.",
        )


def test_upload_project_version_route_invalid_project_name(
    dummy_projects_dir: Path, authenticated_api: TestClient
) -> None:
    with ensure_project_dir_not_created(dummy_projects_dir, "dummy-project-01", "3.0.0"):
        response = authenticated_api.post(
            "/api/projects/äüö/versions/1.0.0", files={"file": ("foo", b"", "application/zip")}
        )
        assert_api_response(
            response=response,
            status_code=400,
            message="'äüö' is not a valid project name.",
        )


def test_upload_project_version_route_invalid_content_type(
    dummy_projects_dir: Path, authenticated_api: TestClient
) -> None:
    with ensure_project_dir_not_created(dummy_projects_dir, "dummy-project-01", "3.0.0"):
        response = authenticated_api.post(
            "/api/projects/dummy-project-01/versions/3.0.0", files={"file": ("foo", b"", "application/invalid")}
        )
        assert_api_response(
            response=response,
            status_code=400,
            message="The uploaded file is invalid: Content type is not 'application/zip'.",
        )


def test_upload_project_version_route_invalid_zip(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:
    with ensure_project_dir_not_created(dummy_projects_dir, "dummy-project-01", "3.0.0"):
        response = authenticated_api.post(
            "/api/projects/dummy-project-01/versions/3.0.0", files={"file": ("foo", b"", "application/zip")}
        )
        assert_api_response(
            response=response,
            status_code=400,
            message="The uploaded file is invalid: File is not a zip file.",
        )


def test_upload_project_version_route_no_index_html(
    dummy_projects_dir: Path, authenticated_api: TestClient, tmp_path: Path
) -> None:
    with ensure_project_dir_not_created(dummy_projects_dir, "dummy-project-01", "3.0.0"):
        invalid_zip_path = tmp_path / "invalid.zip"
        with zipfile.ZipFile(file=invalid_zip_path, mode="w") as archive:
            archive.writestr("noindex.html", "Shit happens...")
        response = authenticated_api.post(
            "/api/projects/dummy-project-01/versions/3.0.0",
            files={"file": (invalid_zip_path.name, invalid_zip_path.read_bytes(), "application/zip")},
        )
        assert_api_response(
            response=response,
            status_code=400,
            message="The uploaded file is invalid: The archive doesn't contain an index.html file.",
        )


def test_upload_existing_project_version_route(
    dummy_projects_dir: Path, authenticated_api: TestClient, example_docs_zip: Path
) -> None:
    version: str = "0.0.1"
    project_name: str = "dummy-project-01"
    project_version_dir = dummy_projects_dir / project_name / version

    assert (project_version_dir).is_dir()
    response = authenticated_api.post(
        f"/api/projects/{project_name}/versions/{version}",
        files={"file": (example_docs_zip.name, example_docs_zip.read_bytes(), "application/zip")},
    )
    assert_api_response(
        response=response,
        status_code=403,
        message=f"Version '{version}' of project '{project_name}' already exists.",
    )
    assert (project_version_dir / "index.html").read_text() == f"This is {version} of {project_name}"
