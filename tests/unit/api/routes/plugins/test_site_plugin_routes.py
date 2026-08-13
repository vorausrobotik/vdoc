"""Contains all unit tests for the site plugin REST API."""

import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS


def test_site_plugin_route_inactive(api: TestClient) -> None:
    response = api.get("/api/plugins/site/")

    assert response.status_code == 200
    assert response.json() == {
        "name": "site",
        "active": False,
        "title": None,
        "description": None,
        "show_on_landing_page": True,
    }


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_TITLE": "voraus robotik Software Documentation",
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_DESCRIPTION": "Everything about the platform.",
    },
)
def test_site_plugin_route(request: pytest.FixtureRequest) -> None:
    # We cannot use the `api` fixture here because a plugin reads its configuration when the app is
    # created, so the environment has to be patched before that happens
    api: TestClient = request.getfixturevalue("api")

    response = api.get("/api/plugins/site/")

    assert response.status_code == 200
    assert response.json() == {
        "name": "site",
        "active": True,
        "title": "voraus robotik Software Documentation",
        "description": "Everything about the platform.",
        "show_on_landing_page": True,
    }
