"""Contains all unit tests for the projects REST API."""

import zipfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from packaging.version import Version

from tests.conftest import DUMMY_DOCS_STRUCTURE, DUMMY_VERSIONS
from tests.utils import assert_api_response, ensure_project_dir_not_created
from vdoc.constants import RESERVED_PROJECT_NAMES
from vdoc.exceptions import ProjectVersionNotFound
from vdoc.models.project import Project
from vdoc.models.project_visibility import ProjectVisibility


def test_list_projects_route(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", display_name="One", description="The first").save()
    Project(name="dummy-project-02", visibility=ProjectVisibility.UNLISTED).save()

    response = api.get("/api/projects/")

    # By title, so "One" follows "dummy-project-03"
    other, listed = response.json()
    assert (other["name"], listed["name"]) == ("dummy-project-03", "dummy-project-01")
    assert listed["display_name"] == "One"
    assert listed["description"] == "The first"
    assert listed["category_id"] is None
    assert listed["visibility"] == "listed"
    assert [version["version"] for version in listed["versions"]] == list(DUMMY_VERSIONS[0])


def test_list_hidden_projects_route(dummy_projects_dir: Path, api: TestClient, authenticated_api: TestClient) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", visibility=ProjectVisibility.LOCKED).save()

    assert api.get("/api/projects/", params={"include_hidden": True}, auth=None).status_code == 401
    response = authenticated_api.get("/api/projects/", params={"include_hidden": True})
    assert [project["name"] for project in response.json()] == list(DUMMY_DOCS_STRUCTURE)


def test_update_project_route(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:  # noqa: ARG001
    Project(name="dummy-project-01", visibility=ProjectVisibility.LOCKED).save()
    project = {
        "name": "dummy-project-01",
        "display_name": "One",
        "description": "What it is",
        "category_id": None,
        "visibility": "unlisted",
    }

    response = authenticated_api.put("/api/projects/dummy-project-01", json=project)

    assert {field: response.json()[field] for field in project} == project
    assert Project.get(name="dummy-project-01") == Project.model_validate(project)


def test_update_project_route_unknown_project(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:  # noqa: ARG001
    response = authenticated_api.put("/api/projects/nope", json={"name": "nope"})

    assert_api_response(response=response, status_code=404, message="Project 'nope' doesn't exist.")


def test_update_project_route_other_project(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:  # noqa: ARG001
    response = authenticated_api.put("/api/projects/dummy-project-01", json={"name": "dummy-project-02"})

    assert response.status_code == 400


def test_wrong_credentials_are_asked_again(authenticated_api: TestClient) -> None:
    """The browser only asks for other credentials when it is told how to send them."""
    response = authenticated_api.get("/api/projects/", params={"include_hidden": True}, auth=("someone", "wrong"))

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Basic"


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


@pytest.mark.parametrize("content_type", ["application/zip", "application/x-zip-compressed"])
def test_upload_project_version_route(
    dummy_projects_dir: Path, authenticated_api: TestClient, example_docs_zip: Path, content_type: str
) -> None:
    project_version_dir = dummy_projects_dir / "dummy-project-01" / "3.0.0"
    assert not project_version_dir.is_dir()
    response = authenticated_api.post(
        "/api/projects/dummy-project-01/versions/3.0.0",
        files={"file": (example_docs_zip.name, example_docs_zip.read_bytes(), content_type)},
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
    assert Project.get(name="dummy-project-01").latest == "3.0.0"


def test_upload_new_project_route(
    dummy_projects_dir: Path,  # noqa: ARG001
    authenticated_api: TestClient,
    example_docs_zip: Path,
) -> None:
    response = authenticated_api.post(
        "/api/projects/new-project/versions/1.0.0",
        files={"file": (example_docs_zip.name, example_docs_zip.read_bytes(), "application/zip")},
    )

    assert response.status_code == 201
    assert Project.get(name="new-project").latest == "1.0.0"


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


@pytest.mark.parametrize("name", sorted(RESERVED_PROJECT_NAMES))
def test_upload_project_version_route_reserved_project_name(
    name: str, dummy_projects_dir: Path, authenticated_api: TestClient
) -> None:
    with ensure_project_dir_not_created(dummy_projects_dir, name, "1.0.0"):
        response = authenticated_api.post(
            f"/api/projects/{name}/versions/1.0.0", files={"file": ("foo", b"", "application/zip")}
        )
        assert_api_response(response=response, status_code=400, message=f"'{name}' is not a valid project name.")


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


def test_delete_project_version_route(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:
    response = authenticated_api.delete("/api/projects/dummy-project-01/versions/2.0.0")

    assert response.status_code == 204
    assert not (dummy_projects_dir / "dummy-project-01" / "2.0.0").exists()
    assert Project.get(name="dummy-project-01").latest == "1.1.0"


def test_delete_project_version_route_unknown_version(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:
    """Only a recorded version is deleted, so a crafted version cannot reach outside the project."""
    # Encoded, because a client resolves a literal `..` before sending, and the server never sees it
    response = authenticated_api.delete("/api/projects/dummy-project-01/versions/%2E%2E")

    assert response.status_code == 404
    assert (dummy_projects_dir / "dummy-project-01").is_dir()


def test_delete_last_project_version_route(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:
    for version in DUMMY_VERSIONS[1]:
        assert authenticated_api.delete(f"/api/projects/dummy-project-02/versions/{version}").status_code == 204

    assert not (dummy_projects_dir / "dummy-project-02").exists()
    assert "dummy-project-02" not in [project.name for project in Project.all(visibility=ProjectVisibility)]


def test_delete_project_route(dummy_projects_dir: Path, authenticated_api: TestClient) -> None:
    Project(name="dummy-project-01", visibility=ProjectVisibility.LOCKED).save()

    assert authenticated_api.delete("/api/projects/dummy-project-01").status_code == 204
    assert not (dummy_projects_dir / "dummy-project-01").exists()
    assert (
        authenticated_api.get("/api/projects/", params={"include_hidden": True}).json()[0]["name"] == "dummy-project-02"
    )
