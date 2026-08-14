"""Contains all unit tests for misc functionalities of REST API."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@patch("vdoc.api.routes.version.get_app_version")
def test_api_get_app_version(get_app_version_mock: MagicMock, api: TestClient) -> None:
    get_app_version_mock.return_value = "42.0.0"
    assert api.get("/api/version/").json() == "42.0.0"


def test_sphinx_inventory(dummy_projects_dir: Path, api: TestClient) -> None:
    inventory_file_mock = dummy_projects_dir / "dummy-project-01" / "2.0.0" / "objects.inv"
    inventory_file_mock.write_text("dummy objects.inv content")
    response = api.get("/dummy-project-01/latest/objects.inv")
    assert response.status_code == 200
    assert response.text == "dummy objects.inv content"


def test_sphinx_inventory_non_existing_project(api: TestClient) -> None:
    response = api.get("/dummy-project-01/latest/objects.inv")
    assert response.status_code == 404


def test_sphinx_inventory_not_shipped_by_the_version(dummy_projects_dir: Path, api: TestClient) -> None:
    """A version built by a generator other than Sphinx has no inventory, which is a 404, not a 500."""
    assert (dummy_projects_dir / "dummy-project-01" / "2.0.0").is_dir()

    response = api.get("/dummy-project-01/latest/objects.inv")

    assert response.status_code == 404
    assert response.json() == {
        "message": "Version '2.0.0' of project 'dummy-project-01' doesn't contain a 'objects.inv' file."
    }


def test_serve_frontend_assets(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, api: TestClient) -> None:
    (tmp_path / "style.css").write_text("dummy style sheet")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)
    response = api.get("/style.css")
    assert response.status_code == 200
    assert response.text == "dummy style sheet"


def test_serve_frontend_assets_rejects_path_traversal(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, api: TestClient
) -> None:
    """A request path is untrusted input, and nothing outside the web UI directory is ours to serve."""
    (tmp_path / "webapp").mkdir()
    (tmp_path / "webapp" / "index.html").write_text("dummy index.html content")
    (tmp_path / "secret.txt").write_text("not ours to serve")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path / "webapp")

    response = api.get("/%2e%2e%2fsecret.txt")

    assert response.status_code == 404
    assert response.text == "dummy index.html content"


@pytest.mark.parametrize(
    ("path", "expected_status_code"),
    [
        ("/", 200),
        ("/dummy-project-01", 200),
        ("/dummy-project-01/1.0.0", 200),
        ("/dummy-project-01/latest", 200),
        # The page is not checked, because a single page documentation has no file for most of its pages
        ("/dummy-project-01/1.0.0/any/page/it/routes/itself", 200),
        ("/not-a-project", 404),
        ("/not-a-project/1.0.0", 404),
        ("/dummy-project-01/9.9.9", 404),
        ("/dummy-project-01/not-a-version", 404),
        ("/robots.txt", 404),
        ("/sitemap.xml", 404),
    ],
)
def test_serve_frontend_index_status_codes(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    dummy_projects_dir: Path,  # noqa: ARG001
    api: TestClient,
    path: str,
    expected_status_code: int,
) -> None:
    """The UI is always returned, but only a path the UI has a route for is returned as a success."""
    (tmp_path / "index.html").write_text("dummy index.html content")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)

    response = api.get(path)

    assert response.status_code == expected_status_code
    assert response.text == "dummy index.html content"


def test_static_latest_redirects_to_the_published_version(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/static/projects/dummy-project-01/latest/index.html", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/projects/dummy-project-01/2.0.0/index.html"


def test_static_latest_serves_the_file_it_redirects_to(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/static/projects/dummy-project-01/latest/index.html")

    assert response.status_code == 200
    assert response.text == "This is 2.0.0 of dummy-project-01"


def test_static_latest_of_an_unknown_project(api: TestClient) -> None:
    response = api.get("/static/projects/not-a-project/latest/index.html", follow_redirects=False)

    assert response.status_code == 404
