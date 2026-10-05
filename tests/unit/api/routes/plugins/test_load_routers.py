"""Contains all unit tests for dynamically loaded plugin routes of the REST API."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import AnyHttpUrl

from vdoc.models.plugins import FooterPlugin, OramaPlugin


@patch("vdoc.api.routes.plugins.Plugin.load_plugins")
def test_plugin_routers_are_added(load_plugins_mock: MagicMock, request: pytest.FixtureRequest) -> None:
    load_plugins_mock.return_value = [
        FooterPlugin(),
        OramaPlugin(
            endpoint=AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index"),
            api_key="super-secret-key",
        ),
    ]

    # We cannot use the `api` fixture here because we need to patch plugins before the app is created
    api: TestClient = request.getfixturevalue("api")

    response = api.get("/api/plugins/")
    assert response.status_code == 200
    assert response.json() == ["footer", "orama"]

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
    assert response.json() == ["footer", "orama", "site"]

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
