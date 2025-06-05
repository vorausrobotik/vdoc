"""Contains all unit tests for dynamically loaded plugin routes of the REST API."""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from pydantic import AnyHttpUrl
from pytest import FixtureRequest

from vdoc.constants import PLUGIN_THEME_DEFAULT_LOGO_URL, PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL
from vdoc.models.plugins import OramaPlugin, ThemePlugin


@patch("vdoc.api.routes.plugins.Plugin.load_plugins")
def test_plugin_routers_are_added(load_plugins_mock: MagicMock, request: FixtureRequest) -> None:
    load_plugins_mock.return_value = [
        ThemePlugin(),
        OramaPlugin(
            endpoint=AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index"),
            api_key="super-secret-key",
        ),
    ]

    # We cannot use the `api` fixture here because we need to patch plugins before the app is created
    api: TestClient = request.getfixturevalue("api")

    response = api.get("/api/plugins/")
    assert response.status_code == 200
    assert response.json() == ["theme", "orama"]

    # Test the theme plugin endpoint
    assert api.get("/api/plugins/theme/").json() == {
        "name": "theme",
        "active": True,
        "dark": {
            "logo_url": str(PLUGIN_THEME_DEFAULT_LOGO_URL),
            "logo_url_small": str(PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL),
        },
        "light": {
            "logo_url": str(PLUGIN_THEME_DEFAULT_LOGO_URL),
            "logo_url_small": str(PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL),
        },
    }

    # Test the Orama plugin endpoint
    assert api.get("/api/plugins/orama/").json() == {
        "name": "orama",
        "active": True,
        "endpoint": "https://cloud.orama.run/v1/indexes/demo-index",
        "api_key": "super-secret-key",
        "dictionary": None,
        "disable_chat": False,
        "facet_property": None,
    }


def test_inactive_plugins(api: TestClient) -> None:
    response = api.get("/api/plugins/")
    assert response.status_code == 200
    assert response.json() == ["footer", "orama", "theme"]

    # Test the Orama plugin endpoint
    assert api.get("/api/plugins/orama/").json() == {
        "name": "orama",
        "active": False,
        "endpoint": None,
        "api_key": None,
        "dictionary": None,
        "disable_chat": False,
        "facet_property": None,
    }
