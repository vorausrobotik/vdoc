"""Contains all projects REST API methods."""

import re
import shutil
import zipfile

from fastapi import UploadFile, status
from fastapi.responses import JSONResponse
from packaging.version import InvalidVersion as PackagingInvalidVersion
from packaging.version import Version

from vdoc.exceptions import InvalidProjectName, InvalidVersion, ProjectVersionAlreadyExists, UploadedFileInvalid
from vdoc.models.project import Project
from vdoc.settings import VDocSettings


def list_projects_impl() -> list[Project]:
    """Lists all projects.

    Returns:
        A list of all projects.
    """
    return Project.list()


def list_project_versions_impl(name: str) -> list[str]:
    """Lists all available versions of a project.

    Args:
        name: The project name.

    Returns:
        A list of all available versions of the project.
    """
    return list(Project(name=name).versions.values())


def get_project_version_impl(name: str, version: str) -> str:
    """Returns the requested version of the project.

    Args:
        name: The project name.
        version: The requested version of the project.

    Returns:
        The requested version of the project.
    """
    parsed_version, _ = Project.get_version_and_docs_path(name=name, version=version)
    return parsed_version


def upload_project_version_impl(name: str, version: str, file: UploadFile) -> JSONResponse:
    """Processes the uploaded documentation.

    Args:
        name: The project name.
        version: The version of the project.
        file: The uploaded file.

    Raises:
        InvalidProjectName: If the project name is invalid.
        InvalidVersion: If the project version is invalid.
        ProjectVersionAlreadyExists: If the uploaded version already exists for the project.
        UploadedFileInvalid: If the uploaded file's content type is invalid.
        UploadedFileInvalid: If the uploaded file's name is invalid.
        UploadedFileInvalid: If the uploaded documentation ZIP is invalid.
        UploadedFileInvalid: If the uploaded documentation ZIP doesn't contain an index.html file.

    Returns:
        _description_
    """
    if not re.match(r"^[a-zA-Z0-9_-]+$", name):
        raise InvalidProjectName(name=name)
    try:
        Version(version=version)
    except PackagingInvalidVersion as error:
        raise InvalidVersion(version=version) from error

    target_path = VDocSettings().docs_dir / name / version

    if target_path.is_dir():
        raise ProjectVersionAlreadyExists(name=name, version=version)

    if file.content_type != "application/zip":
        raise UploadedFileInvalid("Content type is not 'application/zip'")
    if file.filename is None:
        raise UploadedFileInvalid("Uploaded filename is None")
    try:
        with zipfile.ZipFile(file=file.file, mode="r") as archive:
            if "index.html" not in archive.namelist():
                raise UploadedFileInvalid("The archive doesn't contain an index.html file")
            target_path.mkdir(parents=True, exist_ok=True)
            archive.extractall(target_path)
    except zipfile.BadZipFile as error:
        shutil.rmtree(path=target_path, ignore_errors=True)
        raise UploadedFileInvalid(str(error)) from error

    return JSONResponse(
        status_code=status.HTTP_201_CREATED, content=f"Version '{version}' of project '{name}' uploaded successfully."
    )
