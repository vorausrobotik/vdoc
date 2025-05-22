"""Contains the base class for all integrations."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Generator, Literal

from fastapi import APIRouter
from pydantic import PrivateAttr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from vdoc.constants import CONFIG_ENV_PREFIX_INTEGRATIONS

_logger = logging.getLogger(__name__)


ValidIntegrationsT = Literal["orama"]


class Integration(BaseSettings, ABC):
    """Integration model for VDoc."""

    _router: APIRouter = PrivateAttr(default_factory=APIRouter)

    name: ValidIntegrationsT

    def __init_subclass__(cls: type[Integration], **kwargs: Any) -> None:
        """Dynamically set the model_config for each subclass.

        Args:
            cls: The subclass of Integration.
            **kwargs: Additional keyword arguments.
        """
        super().__init_subclass__(**kwargs)
        cls.model_config = SettingsConfigDict(
            env_prefix=f"{CONFIG_ENV_PREFIX_INTEGRATIONS}{cls.name}_",
            env_parse_none_str="None",
            env_nested_delimiter="__",
        )

    @classmethod
    def load_integrations(cls) -> Generator[Integration, None, None]:
        """Load all integrations.

        Raises:
            Exception: If an integration fails to load.

        Yields:
            Generator[Integration, None, None]: A generator of loaded integration instances.
        """
        integrations = cls.__subclasses__()
        for integration_cls in integrations:
            try:
                integration = integration_cls()
                _logger.info(f"Loaded integration: '{integration_cls.__name__}'")
                yield integration
            except Exception as error:
                _logger.exception(f"Failed to load integration '{integration_cls.__name__}': {error}")
                raise error

    @computed_field  # type: ignore[prop-decorator]
    @property
    @abstractmethod
    def active(self) -> bool:
        """Check if the integration is active.

        Returns:
            True if the integration is active, False otherwise.
        """

    @property
    def router(self) -> APIRouter:
        """Get the router for the integration.

        Returns:
            APIRouter: The FastAPI router for the integration.
        """

        @self._router.get("/", response_model=type(self))
        def get_integration_config() -> Integration:
            """Returns the integration configuration and active state.

            Returns:
                The integration configuration.
            """
            return self

        return self._router
