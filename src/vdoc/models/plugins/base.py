"""Contains the base class for all plugins."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Generator, Literal

from fastapi import APIRouter
from pydantic import PrivateAttr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS

_logger = logging.getLogger(__name__)


ValidPluginsT = Literal["theme", "orama", "footer"]


class Plugin(BaseSettings, ABC):
    """Plugin model for VDoc."""

    _router: APIRouter = PrivateAttr(default_factory=APIRouter)

    name: ValidPluginsT

    def __init_subclass__(cls: type[Plugin], **kwargs: Any) -> None:
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
                _logger.info(f"Loaded plugin: '{plugin_cls.__name__}'")
                yield plugin
            except Exception as error:
                _logger.exception(f"Failed to load plugin '{plugin_cls.__name__}': {error}")
                raise error

    @computed_field  # type: ignore[prop-decorator]
    @property
    @abstractmethod
    def active(self) -> bool:
        """Check if the plugin is active.

        Returns:
            True if the plugin is active, False otherwise.
        """

    @property
    def router(self) -> APIRouter:
        """Get the router for the plugin.

        Returns:
            APIRouter: The FastAPI router for the plugin.
        """

        @self._router.get("/", response_model=type(self))
        def get_plugin_config() -> Plugin:
            """Returns the plugin configuration and active state.

            Returns:
                The plugin configuration.
            """
            return self

        return self._router
