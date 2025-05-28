"""Contains all unit tests for the theme plugin."""

import os
from unittest.mock import patch

from pydantic import AnyHttpUrl

from vdoc.models.plugins import ThemePlugin


def test_theme_plugin() -> None:
    plugin = ThemePlugin()

    assert plugin.active is True
    assert plugin.name == "theme"
    assert plugin.light.logo_url is not None
    assert plugin.dark.logo_url is not None
    assert plugin.light.logo_url_small is not None
    assert plugin.dark.logo_url_small is not None


@patch.dict(
    os.environ,
    {
        "VDOC_PLUGINS_THEME_LIGHT__LOGO_URL": "https://light.com",
        "VDOC_PLUGINS_THEME_LIGHT__LOGO_URL_SMALL": "https://small-light.com",
        "VDOC_PLUGINS_THEME_DARK__LOGO_URL": "https://dark.com",
        "VDOC_PLUGINS_THEME_DARK__LOGO_URL_SMALL": "https://small-dark.com",
    },
)
def test_theme_plugin_from_env() -> None:
    plugin = ThemePlugin()
    assert plugin.name == "theme"
    assert plugin.light.logo_url == AnyHttpUrl("https://light.com")
    assert plugin.light.logo_url_small == AnyHttpUrl("https://small-light.com")
    assert plugin.dark.logo_url == AnyHttpUrl("https://dark.com")
    assert plugin.dark.logo_url_small == AnyHttpUrl("https://small-dark.com")
