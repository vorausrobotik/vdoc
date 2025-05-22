"""Contains all unit tests for dynamically loaded integration routes of the REST API."""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from pydantic import AnyHttpUrl
from pytest import FixtureRequest

from vdoc.models.integrations.orama import OramaIntegration


@patch("vdoc.api.routes.integrations.Integration.load_integrations")
def test_integration_routers_are_added(load_integrations_mock: MagicMock, request: FixtureRequest) -> None:
    load_integrations_mock.return_value = [
        OramaIntegration(
            endpoint=AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index"),
            api_key="super-secret-key",
        )
    ]

    # We cannot use the `api` fixture here because we need to patch integrations before the app is created
    api: TestClient = request.getfixturevalue("api")

    response = api.get("/api/integrations/")
    assert response.status_code == 200
    assert response.json() == [
        "orama",
    ]

    # Test the Orama integration endpoint
    assert api.get("/api/integrations/orama/").json() == {
        "name": "orama",
        "active": True,
        "endpoint": "https://cloud.orama.run/v1/indexes/demo-index",
        "api_key": "super-secret-key",
        "dictionary": None,
        "disable_chat": False,
        "facet_property": None,
    }


def test_inactive_integrations(api: TestClient) -> None:
    response = api.get("/api/integrations/")
    assert response.status_code == 200
    assert response.json() == [
        "orama",
    ]

    # Test the Orama integration endpoint
    assert api.get("/api/integrations/orama/").json() == {
        "name": "orama",
        "active": False,
        "endpoint": None,
        "api_key": None,
        "dictionary": None,
        "disable_chat": False,
        "facet_property": None,
    }
