"""Runs the migrations, from ``vdoc.db.migrate`` or from the ``alembic`` command line."""

from collections.abc import Iterator
from contextlib import contextmanager

from alembic import context
from sqlalchemy import Connection

from vdoc.db import get_engine
from vdoc.db.tables import Base


def _run_migrations() -> None:
    # `migrate` hands over the connection it opened. The command line has none and connects to the
    # database the settings name.
    if (connection := context.config.attributes.get("connection")) is not None:
        _run_on(connection=connection)
        return

    with get_engine().connect() as connection:
        _run_on(connection=connection)


def _run_on(connection: Connection) -> None:
    # Batch mode, because SQLite cannot alter most of a table in place and Alembic has to rebuild it
    context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
    with _without_foreign_keys(connection=connection), context.begin_transaction():
        context.run_migrations()
        _check_foreign_keys(connection=connection)


@contextmanager
def _without_foreign_keys(connection: Connection) -> Iterator[None]:
    """Turns the foreign keys of SQLite off while the migrations run.

    A rebuilt table replaces the old one by dropping it, and dropping it fires the ``ON DELETE`` action of
    every row that references it: the projects would lose their category, and the versions their project.
    SQLite ignores the setting inside a transaction, so it is committed before the migrations begin theirs.
    """
    if connection.dialect.name != "sqlite":
        yield
        return
    connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
    connection.commit()
    try:
        yield
    finally:
        # The connection goes back to the pool, and every later session expects the foreign keys on
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
        connection.commit()


def _check_foreign_keys(connection: Connection) -> None:
    """Fails the migrations, and so rolls them back, if they left a reference that points nowhere.

    Raises:
        RuntimeError: If a row references one that does not exist.
    """
    if connection.dialect.name == "sqlite" and (broken := connection.exec_driver_sql("PRAGMA foreign_key_check").all()):
        msg = f"The migrations left references that point nowhere: {broken}"
        raise RuntimeError(msg)


_run_migrations()
