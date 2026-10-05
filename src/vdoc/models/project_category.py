"""Contains the project category model."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from vdoc.db import session
from vdoc.db.tables import CategoryRow
from vdoc.exceptions import CategoryAlreadyExists, CategoryNotFound, CategoryOrderIncomplete


class ProjectCategory(BaseModel):
    """A category the landing page groups projects under."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    position: int

    @classmethod
    def all(cls) -> list[ProjectCategory]:
        """Returns every category, in the order the landing page shows them.

        Returns:
            The categories.
        """
        with session() as db:
            return [cls.model_validate(row) for row in db.scalars(select(CategoryRow).order_by(CategoryRow.position))]

    @classmethod
    def create(cls, name: str) -> ProjectCategory:
        """Creates a category, after all the others.

        Args:
            name: The name of the category.

        Raises:
            CategoryAlreadyExists: If a category of that name exists.

        Returns:
            The created category.
        """
        with session() as db:
            last_position = db.scalar(select(func.max(CategoryRow.position)))
            row = CategoryRow(name=name, position=0 if last_position is None else last_position + 1)
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

    @classmethod
    def reorder(cls, category_ids: list[int]) -> list[ProjectCategory]:
        """Puts the categories in a new order.

        Args:
            category_ids: The ID of every category, in the new order.

        Raises:
            CategoryOrderIncomplete: If the IDs do not name each category exactly once.

        Returns:
            The categories, in the new order.
        """
        with session() as db:
            rows = {row.id: row for row in db.scalars(select(CategoryRow))}
            if sorted(category_ids) != sorted(rows):
                raise CategoryOrderIncomplete
            for position, category_id in enumerate(category_ids):
                rows[category_id].position = position
            db.commit()
            return [cls.model_validate(rows[category_id]) for category_id in category_ids]
