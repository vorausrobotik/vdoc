"""Contains all unit tests for misc functionalities of REST API."""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


@patch("vdoc.api.routes.version.get_app_version")
def test_api_get_app_version(get_app_version_mock: MagicMock, api: TestClient) -> None:
    get_app_version_mock.return_value = "42.0.0"
    assert api.get("/api/version/").json() == "42.0.0"
