"""Contains all tests for the site plugin."""

import os
from unittest.mock import patch

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS
from vdoc.models.plugins import SitePlugin


def test_site_plugin_inactive() -> None:
    """An instance that has not said what it is has nothing to introduce itself with."""
    plugin = SitePlugin()

    assert plugin.active is False
    assert plugin.title is None
    assert plugin.description is None
    assert plugin.show_on_landing_page is True


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
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_SHOW_ON_LANDING_PAGE": "False",
    },
)
def test_site_plugin_from_env() -> None:
    """Hiding the introduction leaves the plugin active, because ``llms.txt`` still uses it."""
    plugin = SitePlugin()

    assert plugin.active is True
    assert plugin.title == "voraus robotik Software Documentation"
    assert plugin.description == "Everything about the platform."
    assert plugin.show_on_landing_page is False
