"""Contains the site plugin."""

from vdoc.models.plugins.base import Plugin, ValidPluginsT


class SitePlugin(Plugin):
    """Site plugin model for vdoc.

    What this instance of vdoc is, in its own words. vdoc itself cannot know: it is a generic
    documentation host, and the same build serves whoever deploys it.

    The values are for both audiences at once. The landing page introduces itself with them, and
    ``llms.txt`` uses them as its heading, its summary and the markdown below it, so a reader and an
    agent are told the same thing about where they have arrived.
    """

    name: ValidPluginsT = "site"

    title: str | None = None

    # One sentence. It is what fills the summary blockquote of llms.txt, which wants to be read at a
    # glance, so anything longer belongs in long_description.
    description: str | None = None

    # Markdown, because the other consumer of it is llms.txt, which is a markdown document: written
    # as markdown it needs no conversion on the way there, and any other markup would need a lossy one.
    #
    # A list of lines rather than one string with line breaks in it. Markdown is line based, and an
    # environment variable is a poor place to keep line breaks -- a deployment platform's web form
    # tends to flatten them, which left the alternative of writing them escaped. A JSON list is what
    # the other plugins already take for their structured settings, and an empty element is a blank
    # line, which is how markdown starts a new paragraph.
    long_description: list[str] | None = None

    # Only the landing page honors this. Whoever reads llms.txt has nothing else to go on, so the
    # text is always in it.
    show_on_landing_page: bool = True

    @property
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """
        return any(value is not None for value in (self.title, self.description, self.long_description))
