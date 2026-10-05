"""Contains all tests for loading plugins."""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS
from vdoc.models.plugins import FooterPlugin, OramaPlugin, SitePlugin
from vdoc.models.plugins.base import Plugin


def test_load_plugins_defaults(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        plugins = list(Plugin.load_plugins())

    assert len(plugins) == 3

    assert isinstance(plugins[0], FooterPlugin)
    assert plugins[0].active is False
    assert isinstance(plugins[1], OramaPlugin)
    assert plugins[1].active is False
    assert isinstance(plugins[2], SitePlugin)
    assert plugins[2].active is False

    assert caplog.messages == [
        "Loaded plugin: 'FooterPlugin'",
        "Loaded plugin: 'OramaPlugin'",
        "Loaded plugin: 'SitePlugin'",
    ]


def test_plugin_router_is_registered_once() -> None:
    """Reading the router must not register the plugin's routes again."""
    plugin = SitePlugin()

    assert len(plugin.router.routes) == 1
    assert len(plugin.router.routes) == 1
    assert len(plugin.router.routes) == 1


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_PLUGINS}ORAMA_ENDPOINT": "https://cloud.orama.run/v1/indexes/demo-index",
        f"{CONFIG_ENV_PREFIX_PLUGINS}ORAMA_API_KEY": "super-secret-key",
        f"{CONFIG_ENV_PREFIX_PLUGINS}FOOTER_COPYRIGHT": "foo",
    },
)
def test_load_plugins_orama_active(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        plugins = list(Plugin.load_plugins())

    assert len(plugins) == 3

    assert isinstance(plugins[0], FooterPlugin)
    assert plugins[0].active is True
    assert isinstance(plugins[1], OramaPlugin)
    assert plugins[1].active is True
    assert isinstance(plugins[2], SitePlugin)
    assert plugins[2].active is False

    assert caplog.messages == [
        "Loaded plugin: 'FooterPlugin'",
        "Loaded plugin: 'OramaPlugin'",
        "Loaded plugin: 'SitePlugin'",
    ]


@patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_THEME": "not-a-theme"})
def test_load_plugins_error(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level("INFO"), pytest.raises(ValidationError, match="Input should be 'voraus' or 'default'"):
        list(Plugin.load_plugins())
    assert caplog.messages[0] == "Loaded plugin: 'FooterPlugin'"
    assert caplog.messages[1] == "Loaded plugin: 'OramaPlugin'"
    assert caplog.messages[2].startswith(
        "Failed to load plugin 'SitePlugin': 1 validation error for SitePlugin\ntheme\n  Input should be"
    )
