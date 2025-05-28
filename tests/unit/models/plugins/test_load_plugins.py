"""Contains all tests for loading plugins."""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError
from pytest import LogCaptureFixture

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS
from vdoc.models.plugins import OramaPlugin, ThemePlugin
from vdoc.models.plugins.base import Plugin


def test_load_plugins_defaults(caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        plugins = list(Plugin.load_plugins())

    assert len(plugins) == 2

    assert isinstance(plugins[0], OramaPlugin)
    assert plugins[0].active is False
    assert isinstance(plugins[1], ThemePlugin)
    assert plugins[1].active is True

    assert caplog.messages == [
        "Loaded plugin: 'OramaPlugin'",
        "Loaded plugin: 'ThemePlugin'",
    ]


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_PLUGINS}ORAMA_ENDPOINT": "https://cloud.orama.run/v1/indexes/demo-index",
        f"{CONFIG_ENV_PREFIX_PLUGINS}ORAMA_API_KEY": "super-secret-key",
    },
)
def test_load_plugins_orama_active(caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        plugins = list(Plugin.load_plugins())

    assert len(plugins) == 2

    assert isinstance(plugins[0], OramaPlugin)
    assert plugins[0].active is True
    assert isinstance(plugins[1], ThemePlugin)
    assert plugins[1].active is True

    assert caplog.messages == [
        "Loaded plugin: 'OramaPlugin'",
        "Loaded plugin: 'ThemePlugin'",
    ]


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_LIGHT__LOGO_URL": "this-is-not-a-valid-url",
    },
)
def test_load_plugins_error(caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"), pytest.raises(ValidationError, match="Input should be a valid URL"):
        list(Plugin.load_plugins())
    assert caplog.messages[0] == "Loaded plugin: 'OramaPlugin'"
    assert caplog.messages[1].startswith(
        "Failed to load plugin 'ThemePlugin': "
        "1 validation error for ThemePlugin\nlight.logo_url\n  Input should be a valid URL"
    )
