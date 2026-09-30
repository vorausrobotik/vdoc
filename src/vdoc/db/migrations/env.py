"""Runs the migrations, from ``vdoc.db.migrate`` or from the ``alembic`` command line."""

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

    with get_engine().begin() as connection:
        _run_on(connection=connection)


def _run_on(connection: Connection) -> None:
    # Batch mode, because SQLite cannot alter most of a table in place and Alembic has to rebuild it
    context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()


_run_migrations()
