"""Contains the footer plugin."""

from typing import Literal

from pydantic import AnyUrl, BaseModel

from vdoc.models.plugins.base import Plugin, ValidPluginsT

LinkIconT = Literal["email", "support", "public", "bugs", "github", "home"]


class FooterLink(BaseModel):
    """Pydantic model for a footer link."""

    title: str
    href: AnyUrl
    icon: LinkIconT


class FooterLinkGroup(BaseModel):
    """Pydantic model for a footer link group."""

    title: str
    links: list[FooterLink]


class FooterPlugin(Plugin):
    """Footer plugin model for vdoc."""

    name: ValidPluginsT = "footer"

    links: list[FooterLinkGroup] = []
    copyright: str | None = None

    @property
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """
        return self.copyright is not None or len(self.links) > 0
