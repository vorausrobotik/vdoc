"""Contains the database that holds how each project is presented."""

from functools import lru_cache
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session

from vdoc.settings import get_settings


@lru_cache(maxsize=8)
def _engine(url: str) -> Engine:
    """Creates the engine for a database, once per URL.

    Keyed on the URL rather than cached outright, so a changed setting gets an engine of its own
    instead of one that still points at the previous database.

    Args:
        url: The database URL.

    Returns:
        The engine.
    """
    engine = create_engine(url)
    if engine.dialect.name == "sqlite":
        # SQLite ignores foreign keys unless every connection turns them on
        def enable_foreign_keys(connection: Any, _: Any) -> None:  # noqa: ANN401
            connection.execute("PRAGMA foreign_keys=ON")

        event.listen(engine, "connect", enable_foreign_keys)
    return engine


def get_engine() -> Engine:
    """Returns the engine for the configured database.

    Returns:
        The engine.
    """
    return _engine(get_settings().database_url)


def session() -> Session:
    """Opens a session on the configured database.

    Returns:
        A new session, to be used as a context manager.
    """
    return Session(get_engine(), expire_on_commit=False)


def migrate(revision: str = "head") -> None:
    """Brings the configured database up to the schema this release expects.

    Creates the database first if it does not exist yet, which for SQLite includes its directory.

    Args:
        revision: The revision to migrate to. Only a test asks for one other than the newest.

    Raises:
        RuntimeError: If the directory of an SQLite database cannot be created.
    """
    engine = get_engine()
    if engine.dialect.name == "sqlite" and engine.url.database:
        directory = Path(engine.url.database).parent
        try:
            directory.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            msg = f"Cannot create the database directory '{directory}'. Set VDOC_DATABASE_URL to a writable location."
            raise RuntimeError(msg) from error

    config = Config()
    config.set_main_option("script_location", "vdoc.db:migrations")
    with engine.connect() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, revision)
