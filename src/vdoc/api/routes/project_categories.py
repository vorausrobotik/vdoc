"""Contains all project category related REST API routes."""

from typing import Annotated

from fastapi import APIRouter, Body, Depends, status

from vdoc.api.dependencies.auth import require_admin
from vdoc.models.project_category import ProjectCategory

router = APIRouter(prefix="/project_categories", tags=["Project Categories"])

CategoryName = Annotated[str, Body(embed=True, min_length=1)]
CategoryIds = Annotated[list[int], Body(embed=True)]


@router.get("/")
def list_project_categories() -> list[ProjectCategory]:
    """Lists all available project categories.

    Returns:
        A list of all available project categories.
    """
    return ProjectCategory.all()


@router.post("/", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_project_category(name: CategoryName) -> ProjectCategory:
    """Creates a project category.

    Args:
        name: The name of the category.

    Returns:
        The created category.
    """
    return ProjectCategory.create(name=name)


# Declared before `/{category_id}`, which would otherwise match `/order` and reject it as no integer
@router.put("/order", dependencies=[Depends(require_admin)])
def reorder_project_categories(category_ids: CategoryIds) -> list[ProjectCategory]:
    """Puts the project categories in the order the landing page shows them.

    Args:
        category_ids: The ID of every category, in the new order.

    Returns:
        The categories, in the new order.
    """
    return ProjectCategory.reorder(category_ids=category_ids)


@router.put("/{category_id}", dependencies=[Depends(require_admin)])
def rename_project_category(category_id: int, name: CategoryName) -> ProjectCategory:
    """Renames a project category.

    Args:
        category_id: The ID of the category.
        name: The new name.

    Returns:
        The renamed category.
    """
    return ProjectCategory.rename(category_id=category_id, name=name)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_project_category(category_id: int) -> None:
    """Deletes a project category. The projects in it are left without one.

    Args:
        category_id: The ID of the category.
    """
    ProjectCategory.delete(category_id=category_id)
