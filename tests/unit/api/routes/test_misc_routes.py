"""Contains all unit tests for misc functionalities of REST API."""

from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from pytest import MonkeyPatch


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


def test_sphinx_inventory_non_existing(api: TestClient) -> None:
    response = api.get("/dummy-project-01/latest/objects.inv")
    assert response.status_code == 404


def test_serve_frontend_assets(monkeypatch: MonkeyPatch, tmp_path: Path, api: TestClient) -> None:
    (tmp_path / "style.css").write_text("dummy style sheet")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)
    response = api.get("/style.css")
    assert response.status_code == 200
    assert response.text == "dummy style sheet"


def test_serve_frontend_assets_index_fallback(monkeypatch: MonkeyPatch, tmp_path: Path, api: TestClient) -> None:
    (tmp_path / "index.html").write_text("dummy index.html content")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)
    response = api.get("/style.css")
    assert response.status_code == 200
    assert response.text == "dummy index.html content"
