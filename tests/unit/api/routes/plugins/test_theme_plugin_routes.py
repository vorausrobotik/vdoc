"""Contains all unit tests for the settings REST API."""

from fastapi.testclient import TestClient

from vdoc.constants import PLUGIN_THEME_DEFAULT_LOGO_URL, PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL


def test_get_theme_config(api: TestClient) -> None:
    assert api.get("/api/plugins/theme/").json() == {
        "name": "theme",
        "light": {
            "logo_url": str(PLUGIN_THEME_DEFAULT_LOGO_URL),
            "logo_url_small": str(PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL),
            "palette": {
                "primary": None,
                "divider": None,
                "background_default": None,
                "background_paper": None,
            },
        },
        "dark": {
            "logo_url": str(PLUGIN_THEME_DEFAULT_LOGO_URL),
            "logo_url_small": str(PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL),
            "palette": {
                "primary": None,
                "divider": None,
                "background_default": None,
                "background_paper": None,
            },
        },
        "border_radius": None,
        "flat_cards": False,
        "active": True,
    }
