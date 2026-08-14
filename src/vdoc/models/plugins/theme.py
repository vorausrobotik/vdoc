"""Contains the theme plugin."""

from typing import Annotated

from pydantic import AnyHttpUrl, BaseModel, StringConstraints

from vdoc.constants import PLUGIN_THEME_DEFAULT_LOGO_URL, PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL
from vdoc.models.plugins.base import Plugin, ValidPluginsT

HexColor = Annotated[str, StringConstraints(pattern=r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")]
"""A CSS hex color. Validated so that a typo fails at startup rather than rendering as nothing."""


class ThemePalette(BaseModel):
    """The palette values a deployment may set, per color mode.

    The names are the frontend's own palette slots, so there is nothing to translate between this and
    what is handed to the theme. Every value is optional, and ``None`` means "leave the framework's own
    default alone" -- which is what keeps vdoc unbranded until somebody says otherwise.

    Adding another value is a field here and one line in the frontend's theme builder.
    """

    primary: HexColor | None = None
    """The color of links, buttons and anything else the interface treats as actionable."""

    divider: HexColor | None = None
    """The color of borders and separators, including the outline of a card."""

    background_default: HexColor | None = None
    """The color of the page itself."""

    background_paper: HexColor | None = None
    """The color of surfaces on the page, such as cards."""


class ThemeSettings(BaseModel):
    """Mode-based settings for the theme plugin."""

    logo_url: AnyHttpUrl | None = PLUGIN_THEME_DEFAULT_LOGO_URL
    logo_url_small: AnyHttpUrl | None = PLUGIN_THEME_DEFAULT_LOGO_URL_SMALL
    palette: ThemePalette = ThemePalette()


class ThemePlugin(Plugin):
    """Theme plugin model for vdoc."""

    name: ValidPluginsT = "theme"

    light: ThemeSettings = ThemeSettings()
    dark: ThemeSettings = ThemeSettings()

    # Shape is not a property of a color mode, so these sit beside the two rather than inside them.
    border_radius: int | None = None
    """How round every corner is, in pixels. ``0`` for square."""

    flat_cards: bool = False
    """Whether cards are drawn as a plain outline instead of a raised surface."""

    @property
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """
        return True
