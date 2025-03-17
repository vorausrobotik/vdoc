"""Contains all unit tests for the project API methods."""

from pathlib import Path

import pytest

from vdoc.methods.api.projects import get_project_version_impl


@pytest.mark.parametrize(
    ["project_name", "requested_version", "expected_version"],
    [("dummy-project-01", "latest", "2.0.0"), ("dummy-project-03", "2.0.0-beta", "2.0.0-beta")],
)
def test_get_project_version_impl(
    dummy_projects_dir: Path,  # pylint: disable=unused-argument
    project_name: str,
    requested_version: str,
    expected_version: str,
) -> None:
    assert get_project_version_impl(project_name, requested_version) == expected_version
