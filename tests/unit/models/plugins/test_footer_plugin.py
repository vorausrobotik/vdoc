"""Contains all unit tests for the Footer plugin."""

import os
from unittest.mock import patch

from pydantic import AnyUrl

from vdoc.models.plugins import FooterPlugin


@patch.dict(os.environ, clear=True)
def test_footer_plugin() -> None:
    plugin = FooterPlugin(copyright="Example GmbH")

    assert plugin.active is True
    assert plugin.copyright == "Example GmbH"
    assert len(plugin.links) == 0


def test_footer_plugin_inactive() -> None:
    plugin = FooterPlugin()
    assert plugin.active is False


@patch.dict(
    os.environ,
    {
        "VDOC_PLUGINS_FOOTER_COPYRIGHT": "Example GmbH",
        # pylint: disable-next=line-too-long
        "VDOC_PLUGINS_FOOTER_LINKS": '[{"title": "Contact", "links": [{"title": "Email", "icon": "email", "href": "mailto:service@example.com"}]}]',
    },
)
def test_footer_plugin_from_env() -> None:
    plugin = FooterPlugin()
    assert plugin.name == "footer"
    assert plugin.copyright == "Example GmbH"
    assert len(plugin.links) == 1
    assert plugin.links[0].title == "Contact"
    assert len(plugin.links[0].links) == 1
    assert plugin.links[0].links[0].title == "Email"
    assert plugin.links[0].links[0].icon == "email"
    assert plugin.links[0].links[0].href == AnyUrl("mailto:service@example.com")
    assert plugin.links[0].links[0].target == "_blank"
