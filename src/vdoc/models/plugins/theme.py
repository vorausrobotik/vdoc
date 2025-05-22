"""Contains the theme plugin."""

from pydantic import AnyHttpUrl, BaseModel

from vdoc.constants import PLUGIN_THEME_DEFAULT_LOGO_URL
from vdoc.models.plugins.base import Plugin, ValidPluginsT


class ThemeSettings(BaseModel):
    """Mode-based settings for the theme plugin."""

    logo_url: AnyHttpUrl | None = None


class ThemePlugin(Plugin):
    """Theme plugin model for vdoc."""

    name: ValidPluginsT = "theme"

    light: ThemeSettings = ThemeSettings(logo_url=PLUGIN_THEME_DEFAULT_LOGO_URL)
    dark: ThemeSettings = ThemeSettings(logo_url=PLUGIN_THEME_DEFAULT_LOGO_URL)

    @property
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """
        return True
