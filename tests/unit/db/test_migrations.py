"""Contains all tests for the database and its migrations."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect

from vdoc.db import get_engine, migrate
from vdoc.db.tables import Base
from vdoc.settings import get_settings


def test_migrations_match_the_tables() -> None:
    """A table changed without a migration for it would only fail on a deployed database."""
    with get_engine().connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)

    assert differences == []


def test_migrate_names_the_setting_when_the_directory_cannot_be_created(tmp_path: Path) -> None:
    (tmp_path / "a-file").write_text("not a directory")

    with patch.dict(os.environ, {"VDOC_DATABASE_URL": f"sqlite:///{tmp_path}/a-file/data/vdoc.db"}):
        get_settings.cache_clear()
        with pytest.raises(RuntimeError, match="Set VDOC_DATABASE_URL to a writable location"):
            migrate()
    get_settings.cache_clear()


def test_migrate_an_in_memory_database() -> None:
    """An SQLite database without a file has no directory to create."""
    with patch.dict(os.environ, {"VDOC_DATABASE_URL": "sqlite://"}):
        get_settings.cache_clear()
        migrate()
        assert {"project", "version", "category"} <= set(inspect(get_engine()).get_table_names())
        get_engine().dispose()
    get_settings.cache_clear()
