"""Contains the database tables."""

from datetime import datetime

from sqlalchemy import Enum, ForeignKey, MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from vdoc.models.project_visibility import ProjectVisibility


class Base(DeclarativeBase):
    """The declarative base of every table."""

    # Named constraints, because SQLite cannot alter a table in place: Alembic rebuilds it instead, and
    # it can only carry over or drop a constraint that has a name.
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


class CategoryRow(Base):
    """A category the landing page groups projects under."""

    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)


class ProjectRow(Base):
    """A project, and how it is presented."""

    __tablename__ = "project"

    name: Mapped[str] = mapped_column(primary_key=True)
    display_name: Mapped[str | None]
    description: Mapped[str | None]
    category_id: Mapped[int | None] = mapped_column(ForeignKey("category.id", ondelete="SET NULL"))
    # Stored as its value in a plain string column, so a further visibility needs no migration
    visibility: Mapped[ProjectVisibility] = mapped_column(
        Enum(
            ProjectVisibility, native_enum=False, values_callable=lambda members: [member.value for member in members]
        ),
        default=ProjectVisibility.LISTED,
    )


class VersionRow(Base):
    """A published version of a project. Its files are in the documentation directory."""

    __tablename__ = "version"

    project_name: Mapped[str] = mapped_column(ForeignKey("project.name", ondelete="CASCADE"), primary_key=True)
    version: Mapped[str] = mapped_column(primary_key=True)
    """Spelled as it was uploaded, which is also the name of its directory."""
    published_at: Mapped[datetime]
