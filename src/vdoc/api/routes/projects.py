"""Contains all projects related REST API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, UploadFile, status
from fastapi.responses import JSONResponse

from vdoc.api.dependencies.auth import Credentials, require_admin, require_authentication
from vdoc.exceptions import InvalidProjectName
from vdoc.methods.api.projects import (
    get_project_version_impl,
    list_project_versions_impl,
    upload_project_version_impl,
)
from vdoc.models.project import Project
from vdoc.models.project_visibility import ProjectVisibility

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/")
def list_projects(request: Request, credentials: Credentials, include_hidden: bool = False) -> list[Project]:  # noqa: FBT001, FBT002
    """Lists all listed projects, or with ``include_hidden`` all projects.

    Args:
        request: The request, whose session holds the login.
        credentials: The HTTPBasicAuth credentials sent with the request header, if any.
        include_hidden: Whether unlisted and locked projects are listed too, which requires the admin.

    Returns:
        A list of projects.
    """
    if include_hidden:
        require_admin(request=request, credentials=credentials)
        return Project.all(visibility=ProjectVisibility)
    return Project.all()


@router.put("/{name}", dependencies=[Depends(require_admin)])
def update_project(name: str, project: Project) -> Project:
    """Replaces how a project is presented.

    Args:
        name: The project name.
        project: The project as it is to be presented.

    Raises:
        InvalidProjectName: If the project in the body is another one than the address names.

    Returns:
        The updated project.
    """
    if project.name != name:
        raise InvalidProjectName(name=project.name)
    project.save()
    return project


@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_project(name: str) -> None:
    """Deletes a project, with every version and all their files.

    Args:
        name: The project name.
    """
    Project.get(name=name, visibility=ProjectVisibility).delete()


@router.delete(
    "/{name}/versions/{version}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)]
)
def delete_project_version(name: str, version: str) -> None:
    """Deletes a published version and its files. Deleting the last version deletes the project.

    Args:
        name: The project name.
        version: The version, spelled exactly as it was published.
    """
    Project.get(name=name, visibility=ProjectVisibility).delete_version(version=version)


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
