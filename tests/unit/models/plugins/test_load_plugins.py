"""Contains all tests for loading plugins."""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError
from pytest import LogCaptureFixture

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS
from vdoc.models.plugins import ThemePlugin
from vdoc.models.plugins.base import Plugin


def test_load_plugins(caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        plugins = list(Plugin.load_plugins())

    assert len(plugins) == 1

    assert isinstance(plugins[0], ThemePlugin)

    assert caplog.messages == [
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
    assert caplog.messages[0].startswith(
        "Failed to load plugin 'ThemePlugin': "
        "1 validation error for ThemePlugin\nlight.logo_url\n  Input should be a valid URL"
    )
