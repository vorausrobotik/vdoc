"""Contains all unit tests for the settings REST API."""

from fastapi.testclient import TestClient

from vdoc.constants import PLUGIN_THEME_DEFAULT_LOGO_URL


def test_get_theme_config(api: TestClient) -> None:
    assert api.get("/api/plugins/theme/").json() == {
        "name": "theme",
        "light": {
            "logo_url": str(PLUGIN_THEME_DEFAULT_LOGO_URL),
        },
        "dark": {
            "logo_url": str(PLUGIN_THEME_DEFAULT_LOGO_URL),
        },
        "active": True,
    }
