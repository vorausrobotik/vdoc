"""Contains all unit tests for the settings REST API."""

import os
from unittest.mock import patch

from fastapi.testclient import TestClient

from vdoc.constants import DEFAULT_LOGO_DARK_URL, DEFAULT_LOGO_LIGHT_URL


@patch.dict(os.environ, {"VDOC_LOGO_LIGHT_URL": "FOO", "VDOC_LOGO_DARK_URL": "BAR"}, clear=True)
def test_get_logo_urls(api: TestClient) -> None:
    assert api.get("/api/settings/logo_url/light").json() == "FOO"
    assert api.get("/api/settings/logo_url/dark").json() == "BAR"
    assert api.get("/api/settings/logo_url/invalid").status_code == 422


@patch.dict(os.environ, clear=True)
def test_get_logo_urls_defaults(api: TestClient) -> None:
    assert api.get("/api/settings/logo_url/light").json() == DEFAULT_LOGO_LIGHT_URL
    assert api.get("/api/settings/logo_url/dark").json() == DEFAULT_LOGO_DARK_URL
