"""Contains all settings tests."""

import os
from pathlib import Path
from unittest.mock import patch

from vdoc.settings import VDocSettings


def test_vdoc_settings() -> None:
    settings = VDocSettings()
    assert settings.docs_dir == Path("/srv/vdoc/docs/")


@patch.dict(os.environ, {"VDOC_DOCS_DIR": "/tmp/foo"})
def test_vdoc_settings_patchable() -> None:
    settings = VDocSettings()
    assert settings.docs_dir == Path("/tmp/foo/")
