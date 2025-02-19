"""Contains all unit tests for the project API methods."""

from pathlib import Path

from vdoc.methods.api.projects import get_project_version_impl


def test_get_project_version_impl(dummy_projects_dir: Path) -> None:  # pylint: disable=unused-argument
    assert get_project_version_impl("dummy-project-01", "latest") == "2.0.0"
