"""Contains all unit tests for misc functionalities of REST API."""

from fastapi.testclient import TestClient
from pytest import MonkeyPatch


def test_api_get_app_version(monkeypatch: MonkeyPatch, api: TestClient) -> None:
    monkeypatch.setattr("vdoc.__version__", "42.0.0")
    assert api.get("/api/version").json() == "42.0.0"
