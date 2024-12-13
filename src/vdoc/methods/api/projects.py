"""Contains all projects REST API methods."""

from vdoc.models.project import Project


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
    return [str(version) for version in Project(name=name).versions]


def get_project_version_and_latest_version_impl(name: str, version: str) -> tuple[str, str]:
    """Returns the requested version of the project as well as the latest version.

    Args:
        name: The project name.
        version: The requested version of the project.

    Returns:
        The requested version of the project as well as the latest version.
    """
    parsed_version, _ = Project.get_version_and_docs_path(name=name, version=version)
    latest_version = Project(name=name).latest
    return str(parsed_version), str(latest_version)
