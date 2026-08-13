"""Contains the site plugin."""

from vdoc.models.plugins.base import Plugin, ValidPluginsT


class SitePlugin(Plugin):
    """Site plugin model for vdoc.

    What this instance of vdoc is, in its own words. vdoc itself cannot know: it is a generic
    documentation host, and the same build serves whoever deploys it.

    The values are for both audiences at once. The landing page introduces itself with them, and
    ``llms.txt`` uses them as its heading and summary, so a reader and an agent are told the same
    thing about where they have arrived.
    """

    name: ValidPluginsT = "site"

    title: str | None = None
    description: str | None = None

    # Only the landing page honors this. Whoever reads llms.txt has nothing else to go on, so the
    # title and the description are always in it.
    show_on_landing_page: bool = True

    @property
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """
        return self.title is not None or self.description is not None
