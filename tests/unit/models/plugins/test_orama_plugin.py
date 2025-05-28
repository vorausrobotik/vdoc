"""Contains all unit tests for the Orama plugin."""

import os
from unittest.mock import patch

from pydantic import AnyHttpUrl

from vdoc.models.plugins import OramaPlugin


def test_orama_plugin() -> None:
    plugin = OramaPlugin(
        endpoint=AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index"),
        api_key="super-secret-key",
    )

    assert plugin.active is True
    assert plugin.name == "orama"
    assert plugin.endpoint == AnyHttpUrl("https://cloud.orama.run/v1/indexes/demo-index")
    assert plugin.api_key == "super-secret-key"


def test_orama_plugin_inactive() -> None:
    plugin = OramaPlugin()
    assert plugin.active is False


@patch.dict(
    os.environ,
    {
        "VDOC_PLUGINS_ORAMA_ENDPOINT": "https://example.com",
        "VDOC_PLUGINS_ORAMA_API_KEY": "super-secret-key",
        "VDOC_PLUGINS_ORAMA_DICTIONARY__DISCLAIMER": "This is a disclaimer",
        "VDOC_PLUGINS_ORAMA_FACET_PROPERTY": "facet_property",
    },
)
def test_orama_plugin_from_env() -> None:
    plugin = OramaPlugin()
    assert plugin.name == "orama"
    assert plugin.endpoint == AnyHttpUrl("https://example.com")
    assert plugin.api_key == "super-secret-key"
    assert plugin.facet_property == "facet_property"
    assert plugin.dictionary is not None
    assert plugin.dictionary.disclaimer == "This is a disclaimer"
