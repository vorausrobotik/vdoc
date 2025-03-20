"""Contains all projects REST API methods."""

from vdoc.models.project_category import ProjectCategory
from vdoc.settings import VDocSettings


def list_project_categories_impl() -> list[ProjectCategory]:
    """Lists all project categories.

    Returns:
        A list of all projects.
    """
    return VDocSettings().project_categories
