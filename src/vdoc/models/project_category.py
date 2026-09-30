"""Contains the project category model."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from vdoc.db import session
from vdoc.db.tables import CategoryRow
from vdoc.exceptions import CategoryAlreadyExists, CategoryNotFound


class ProjectCategory(BaseModel):
    """A category the landing page groups projects under."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str

    @classmethod
    def all(cls) -> list[ProjectCategory]:
        """Returns every category, in the order they were created.

        Returns:
            The categories.
        """
        with session() as db:
            return [cls.model_validate(row) for row in db.scalars(select(CategoryRow).order_by(CategoryRow.id))]

    @classmethod
    def create(cls, name: str) -> ProjectCategory:
        """Creates a category.

        Args:
            name: The name of the category.

        Raises:
            CategoryAlreadyExists: If a category of that name exists.

        Returns:
            The created category.
        """
        with session() as db:
            row = CategoryRow(name=name)
            db.add(row)
            try:
                db.commit()
            except IntegrityError as error:
                raise CategoryAlreadyExists(name=name) from error
            return cls.model_validate(row)

    @classmethod
    def rename(cls, category_id: int, name: str) -> ProjectCategory:
        """Renames a category.

        Args:
            category_id: The ID of the category.
            name: The new name.

        Raises:
            CategoryNotFound: If there is no category with that ID.
            CategoryAlreadyExists: If another category has that name.

        Returns:
            The renamed category.
        """
        with session() as db:
            if (row := db.get(CategoryRow, category_id)) is None:
                raise CategoryNotFound(category_id=category_id)
            row.name = name
            try:
                db.commit()
            except IntegrityError as error:
                raise CategoryAlreadyExists(name=name) from error
            return cls.model_validate(row)

    @classmethod
    def delete(cls, category_id: int) -> None:
        """Deletes a category. The projects in it are left without one.

        Args:
            category_id: The ID of the category.

        Raises:
            CategoryNotFound: If there is no category with that ID.
        """
        with session() as db:
            if (row := db.get(CategoryRow, category_id)) is None:
                raise CategoryNotFound(category_id=category_id)
            db.delete(row)
            db.commit()
