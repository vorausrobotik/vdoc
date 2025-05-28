"""Contains the orama plugin."""

from pydantic import AnyHttpUrl, BaseModel

from vdoc.models.plugins.base import Plugin, ValidPluginsT


class OramaDictionary(BaseModel):
    """Custom text dictionary for localization."""

    search_placeholder: str | None = None
    chat_placeholder: str | None = None
    no_results_found: str | None = None
    no_results_found_for: str | None = None
    suggestions: list[str] | None = None
    see_all: str | None = None
    add_more: str | None = None
    clear_chat: str | None = None
    error_message: str | None = None
    disclaimer: str | None = None
    start_your_search: str | None = None
    init_error_search: str | None = None
    init_error_chat: str | None = None
    chat_button_label: str | None = None
    search_button_label: str | None = None


class OramaPlugin(Plugin):
    """Orama plugin model for vdoc."""

    name: ValidPluginsT = "orama"

    endpoint: AnyHttpUrl | None = None
    api_key: str | None = None
    disable_chat: bool = False
    facet_property: str | None = None
    dictionary: OramaDictionary | None = None

    @property
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """
        return self.endpoint is not None and self.api_key is not None
