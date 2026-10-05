"""Let the categories be put in order

Revision ID: 811bfcc91cc3
Revises: e612a95748e2
Create Date: 2026-10-05 15:44:10.950509
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "811bfcc91cc3"
down_revision: str | Sequence[str] | None = "e612a95748e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrades the schema."""
    with op.batch_alter_table("category", schema=None) as batch_op:
        batch_op.add_column(sa.Column("position", sa.Integer(), nullable=True))
    # The landing page showed the categories by their ID, so that order is kept
    op.execute("UPDATE category SET position = id")
    with op.batch_alter_table("category", schema=None) as batch_op:
        batch_op.alter_column("position", nullable=False)


def downgrade() -> None:
    """Downgrades the schema."""
    with op.batch_alter_table("category", schema=None) as batch_op:
        batch_op.drop_column("position")
