"""Contains the base class for all plugins."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any, Literal

from fastapi import APIRouter
from pydantic import PrivateAttr, computed_field
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict

from vdoc.config_file import ConfigFileSettingsSource
from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS, CONFIG_FILE_SECTION_PLUGINS

if TYPE_CHECKING:
    from collections.abc import Generator

_logger = logging.getLogger(__name__)


ValidPluginsT = Literal["theme", "orama", "footer", "site"]


class Plugin(BaseSettings, ABC):
    """Plugin model for VDoc."""

    _router: APIRouter = PrivateAttr(default_factory=APIRouter)

    name: ValidPluginsT

    def __init_subclass__(cls: type[Plugin], **kwargs: Any) -> None:  # noqa: ANN401
        """Dynamically set the model_config for each subclass.

        Args:
            cls: The subclass of Plugin.
            **kwargs: Additional keyword arguments.
        """
        super().__init_subclass__(**kwargs)
        cls.model_config = SettingsConfigDict(
            env_prefix=f"{CONFIG_ENV_PREFIX_PLUGINS}{cls.name}_",
            env_parse_none_str="None",
            env_nested_delimiter="__",
        )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Adds the plugin's own table of the configuration file as the lowest priority source.

        Defined here rather than per plugin, so that every plugin -- and every plugin added later --
        reads ``[plugins.<name>]`` without any code of its own, the same way it already gets its
        environment prefix from ``__init_subclass__``.

        Args:
            settings_cls: The plugin class being built.
            init_settings: Values passed to the constructor.
            env_settings: Values from the environment.
            dotenv_settings: Values from a dotenv file.
            file_secret_settings: Values from a secrets directory.

        Returns:
            The sources to read, highest priority first.
        """
        name = settings_cls.model_fields["name"].default
        section = (CONFIG_FILE_SECTION_PLUGINS, name) if isinstance(name, str) else ()

        return (
            init_settings,
            env_settings,
            dotenv_settings,
            file_secret_settings,
            ConfigFileSettingsSource(settings_cls, section=section),
        )

    @classmethod
    def load_plugins(cls) -> Generator[Plugin, None, None]:
        """Load all plugins.

        Raises:
            Exception: If an plugin fails to load.

        Yields:
            Generator[Plugin, None, None]: A generator of loaded plugin instances.
        """
        plugins = cls.__subclasses__()
        for plugin_cls in plugins:
            try:
                plugin = plugin_cls()
                _logger.info("Loaded plugin: '%s'", plugin_cls.__name__)
                yield plugin
            except Exception as error:
                _logger.exception("Failed to load plugin '%s': %s", plugin_cls.__name__, error)  # noqa: TRY401
                raise

    @computed_field  # type: ignore[prop-decorator]
    @property
    @abstractmethod
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """

    def model_post_init(self, _context: Any) -> None:  # noqa: ANN401
        """Registers the plugin's routes on its own router.

        Done once per instance, at construction. While this lived in the ``router`` property it ran on
        every read of it, so each read appended another copy of the same route.

        Args:
            _context: The pydantic validation context. Unread.
        """

        @self._router.get("/", response_model=type(self))
        def get_plugin_config() -> Plugin:
            """Returns the plugin configuration and active state.

            Returns:
                The plugin configuration.
            """
            return self

    @property
    def router(self) -> APIRouter:
        """Get the router for the plugin.

        Returns:
            APIRouter: The FastAPI router for the plugin.
        """
        return self._router
