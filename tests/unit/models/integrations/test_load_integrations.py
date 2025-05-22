"""Contains all tests for loading integrations."""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError
from pytest import LogCaptureFixture

from vdoc.constants import CONFIG_ENV_PREFIX_INTEGRATIONS
from vdoc.models.integrations import OramaIntegration
from vdoc.models.integrations.base import Integration


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_INTEGRATIONS}ORAMA_ENDPOINT": "https://cloud.orama.run/v1/indexes/demo-index",
        f"{CONFIG_ENV_PREFIX_INTEGRATIONS}ORAMA_API_KEY": "super-secret-key",
    },
)
def test_load_integrations(caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        integrations = list(Integration.load_integrations())

    assert len(integrations) == 1

    assert isinstance(integrations[0], OramaIntegration)

    assert caplog.messages == [
        "Loaded integration: 'OramaIntegration'",
    ]


@patch.dict(
    os.environ,
    {
        f"{CONFIG_ENV_PREFIX_INTEGRATIONS}ORAMA_ENDPOINT": "this-is-not-a-valid-url",
    },
)
def test_load_integrations_error(caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"), pytest.raises(ValidationError, match="Input should be a valid URL"):
        list(Integration.load_integrations())
    assert caplog.messages[0].startswith(
        "Failed to load integration 'OramaIntegration': "
        "1 validation error for OramaIntegration\nendpoint\n  Input should be a valid URL"
    )
