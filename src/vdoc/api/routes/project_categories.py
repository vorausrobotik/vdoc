"""Contains all project category related REST API routes."""

from fastapi import APIRouter

from vdoc.methods.api.project_categories import list_project_categories_impl
from vdoc.models.project_category import ProjectCategory

router = APIRouter(prefix="/project_categories", tags=["Project Categories"])


@router.get("/")
def list_project_categories() -> list[ProjectCategory]:
    """Lists all available project categories.

    Returns:
        A list of all available project categories.
    """
    return list_project_categories_impl()
