"""Contains all settings tests."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest

from vdoc.settings import VDocSettings


@patch.dict(os.environ, clear=True)
def test_vdoc_settings() -> None:
    settings = VDocSettings()
    assert settings.docs_dir == Path("/srv/vdoc/docs/")


@patch.dict(os.environ, {"VDOC_DOCS_DIR": "/tmp/foo"}, clear=True)  # noqa: S108
def test_vdoc_settings_patchable() -> None:
    settings = VDocSettings()
    assert settings.docs_dir == Path("/tmp/foo/")  # noqa: S108


def test_vdoc_settings_database_inside_docs_dir(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="must not be inside the documentation directory"):
        VDocSettings(docs_dir=tmp_path, database_url=f"sqlite:///{tmp_path}/project/vdoc.db")


def test_vdoc_settings_database_beside_docs_dir(tmp_path: Path) -> None:
    settings = VDocSettings(docs_dir=tmp_path / "docs", database_url=f"sqlite:///{tmp_path}/data/vdoc.db")
    assert settings.database_url == f"sqlite:///{tmp_path}/data/vdoc.db"


@pytest.mark.parametrize("database_url", ["sqlite://", "postgresql://vdoc@db.example/vdoc"])
def test_vdoc_settings_database_without_a_file(database_url: str, tmp_path: Path) -> None:
    """Only a database file can end up among the served files, so no other database is checked."""
    assert VDocSettings(docs_dir=tmp_path, database_url=database_url).database_url == database_url
