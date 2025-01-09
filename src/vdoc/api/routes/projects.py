"""Contains all projects related REST API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import JSONResponse

from vdoc.api.dependencies.auth import require_authentication
from vdoc.methods.api.projects import (
    get_project_version_impl,
    list_project_versions_impl,
    list_projects_impl,
    upload_project_version_impl,
)
from vdoc.models.project import Project

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/")
def list_projects() -> list[Project]:
    """Lists all available projects.

    Returns:
        A list of all available projects.
    """
    return list_projects_impl()


@router.get("/{name}/versions/")
def list_project_versions(name: str) -> list[str]:
    """Lists all versions of a project.

    Args:
        name: The name of the project.

    Returns:
        A list of all versions of a project.
    """
    return list_project_versions_impl(name=name)


@router.get("/{name}/versions/{version}")
def get_project_versions(name: str, version: str) -> str:
    """Returns the requested project version.

    Args:
        name: The name of the project.
        version: The requested version.

    Returns:
        The requested project version.
    """
    return get_project_version_impl(name=name, version=version)


@router.post("/{name}/versions/{version}")
def upload_project_version(
    name: str, version: str, file: UploadFile, _: Annotated[str, Depends(require_authentication)]
) -> JSONResponse:
    """Accepts and processes an uploaded project documentation.

    Args:
        name: The project name.
        version: The project version.
        file: The documentation zip file.

    Returns:
        A message that the documentation has been uploaded successfully.
    """
    return upload_project_version_impl(name=name, version=version, file=file)
