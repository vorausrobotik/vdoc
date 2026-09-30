"""Contains integration tests for the intersphinx mapping."""

from pathlib import Path

import pytest

from tests.utils import start_vdoc_server_and_get_uri
from vdoc.constants import CONFIG_ENV_PREFIX


@pytest.mark.skip("Not fully implemented yet")
def test_intersphinx(sample_docs: Path, sample_docs_database_env: dict[str, str]) -> None:
    environment = {f"{CONFIG_ENV_PREFIX}DOCS_DIR": sample_docs.as_posix(), **sample_docs_database_env}
    with start_vdoc_server_and_get_uri(env=environment):  # pylint: disable=unused-variable
        print()
