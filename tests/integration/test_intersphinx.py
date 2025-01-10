"""Contains integration tests for the intersphinx mapping."""

from pathlib import Path

import pytest

from tests.utils import start_vdoc_server_and_get_uri
from vdoc.constants import CONFIG_ENV_PREFIX


@pytest.mark.skip("Not fully implemented yet")
def test_intersphinx(sample_docs: Path) -> None:
    with start_vdoc_server_and_get_uri(
        env={f"{CONFIG_ENV_PREFIX}DOCS_DIR": sample_docs.as_posix()}
    ) as server_uri:  # pylint: disable=unused-variable
        print()
