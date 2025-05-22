"""Contains all unit tests for the Orama integration."""

import os
from unittest.mock import patch

from pydantic import AnyHttpUrl

from vdoc.models.integrations import OramaIntegration


def test_orama_integration() -> None:
    integration = OramaIntegration(
        endpoint=AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index"),
        api_key="super-secret-key",
    )

    assert integration.active is True
    assert integration.name == "orama"
    assert integration.endpoint == AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index")
    assert integration.api_key == "super-secret-key"


def test_orama_integration_inactive() -> None:
    integration = OramaIntegration()
    assert integration.active is False


@patch.dict(
    os.environ,
    {
        "VDOC_INT_ORAMA_ENDPOINT": "https://example.com",
        "VDOC_INT_ORAMA_API_KEY": "super-secret-key",
        "VDOC_INT_ORAMA_DICTIONARY__DISCLAIMER": "This is a disclaimer",
        "VDOC_INT_ORAMA_FACET_PROPERTY": "facet_property",
    },
)
def test_orama_integration_from_env() -> None:
    integration = OramaIntegration()
    assert integration.name == "orama"
    assert integration.endpoint == AnyHttpUrl("https://example.com")
    assert integration.api_key == "super-secret-key"
    assert integration.facet_property == "facet_property"
    assert integration.dictionary is not None
    assert integration.dictionary.disclaimer == "This is a disclaimer"
