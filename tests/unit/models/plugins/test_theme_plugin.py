"""Contains all unit tests for the theme plugin."""

import os
from unittest.mock import patch

import pytest
from pydantic import AnyHttpUrl, ValidationError

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS
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


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_LIGHT__PALETTE__PRIMARY": "#E133FF",
        f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_DARK__PALETTE__PRIMARY": "#00CFC6",
        f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_DARK__PALETTE__BACKGROUND_DEFAULT": "#0C0C0E",
        f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_BORDER_RADIUS": "0",
        f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_FLAT_CARDS": "True",
    },
)
def test_theme_plugin_palette_from_env() -> None:
    plugin = ThemePlugin()

    assert plugin.light.palette.primary == "#E133FF"
    assert plugin.dark.palette.primary == "#00CFC6"
    assert plugin.dark.palette.background_default == "#0C0C0E"
    assert plugin.border_radius == 0
    assert plugin.flat_cards is True


def test_theme_plugin_palette_defaults_to_nothing() -> None:
    """An unconfigured palette has to leave every framework default in place."""
    plugin = ThemePlugin()

    assert plugin.light.palette.model_dump(exclude_none=True) == {}
    assert plugin.dark.palette.model_dump(exclude_none=True) == {}
    assert plugin.border_radius is None
    assert plugin.flat_cards is False


@patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX_PLUGINS}THEME_LIGHT__PALETTE__PRIMARY": "E133FF"})
def test_theme_plugin_rejects_a_color_without_a_hash() -> None:
    """A malformed color has to fail at startup, since it renders as nothing at all."""
    with pytest.raises(ValidationError, match="String should match pattern"):
        ThemePlugin()
