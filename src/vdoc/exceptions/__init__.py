"""Contains all exceptions."""

from fastapi import status
from fastapi.exceptions import HTTPException
from packaging.version import Version


class VDocException(HTTPException):
    """Base exception class for all vdoc exceptions."""


class InvalidCredentials(VDocException):
    """Exception when the provided credentials are invalid."""

    def __init__(self) -> None:  # noqa: D107
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username and/or password",
            headers={"WWW-Authenticate": "Basic"},
        )


class ProjectNotFound(VDocException):
    """Exception when a project doesn't exist."""

    def __init__(self, name: str) -> None:  # noqa: D107
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project '{name}' doesn't exist.")


class InvalidVersion(VDocException):
    """Exception when a requested version has an invalid format."""

    def __init__(self, version: str):  # noqa: D107
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"'{version}' is not a valid version identifier."
        )


class InvalidProjectName(VDocException):
    """Exception when a requested project name is invalid."""

    def __init__(self, name: str):  # noqa: D107
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=f"'{name}' is not a valid project name.")


class ProjectVersionNotFound(VDocException):
    """Exception when a project version doesn't exist."""

    def __init__(self, name: str, version: Version | str) -> None:  # noqa: D107
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' doesn't have a documentation for version '{version}'.",
        )


class ProjectVersionAlreadyExists(VDocException):
    """Exception when a project version already exist."""

    def __init__(self, name: str, version: Version | str) -> None:  # noqa: D107
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN, detail=f"Version '{version}' of project '{name}' already exists."
        )


class UploadedFileInvalid(VDocException):
    """Exception when the uploaded file is invalid."""

    def __init__(self, reason: str) -> None:  # noqa: D107
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=f"The uploaded file is invalid: {reason}.")
