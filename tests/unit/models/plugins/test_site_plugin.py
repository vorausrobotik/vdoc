"""Contains all tests for the site plugin."""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS
from vdoc.models.plugins import SitePlugin


def test_site_plugin_inactive() -> None:
    """An instance that has not said what it is has nothing to introduce itself with."""
    plugin = SitePlugin()

    assert plugin.active is False
    assert plugin.title is None
    assert plugin.description is None
    assert plugin.long_description is None
    assert plugin.show_on_landing_page is True


@patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_LONG_DESCRIPTION": '["- one", "- two"]'})
def test_site_plugin_active_with_only_a_long_description() -> None:
    plugin = SitePlugin()

    assert plugin.active is True
    assert plugin.long_description == ["- one", "- two"]


@patch.dict(
    os.environ,
    {f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_LONG_DESCRIPTION": '["A paragraph.", "", "- one", "- two"]'},
)
def test_site_plugin_long_description_keeps_blank_lines() -> None:
    """An empty element is a blank line, which is how markdown starts a new paragraph."""
    assert SitePlugin().long_description == ["A paragraph.", "", "- one", "- two"]


@patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_LONG_DESCRIPTION": "not json"})
def test_site_plugin_long_description_rejects_a_plain_string() -> None:
    """A malformed value has to fail at startup rather than reach the landing page."""
    with pytest.raises(ValidationError, match="Input should be a valid list"):
        SitePlugin()


@patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_TITLE": "voraus robotik Software Documentation"})
def test_site_plugin_active_with_only_a_title() -> None:
    plugin = SitePlugin()

    assert plugin.active is True
    assert plugin.title == "voraus robotik Software Documentation"
    assert plugin.description is None


@patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_DESCRIPTION": "Everything about the platform."})
def test_site_plugin_active_with_only_a_description() -> None:
    plugin = SitePlugin()

    assert plugin.active is True
    assert plugin.title is None
    assert plugin.description == "Everything about the platform."


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_TITLE": "voraus robotik Software Documentation",
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_DESCRIPTION": "Everything about the platform.",
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_LONG_DESCRIPTION": '["- **voraus.core**", "- **voraus.pioneer**"]',
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_SHOW_ON_LANDING_PAGE": "False",
    },
)
def test_site_plugin_from_env() -> None:
    """Hiding the introduction leaves the plugin active, because ``llms.txt`` still uses it."""
    plugin = SitePlugin()

    assert plugin.active is True
    assert plugin.title == "voraus robotik Software Documentation"
    assert plugin.description == "Everything about the platform."
    assert plugin.long_description == ["- **voraus.core**", "- **voraus.pioneer**"]
    assert plugin.show_on_landing_page is False
