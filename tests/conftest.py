"""This module contains pytest fixtures."""

import os
from pathlib import Path
from typing import Generator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from vdoc.api import app

DUMMY_DOCS_STRUCTURE = {
    "dummy-project-01": ["0.0.1", "0.0.2", "0.1.0", "0.2.0"],
    "dummy-project-02": ["6.0", "1.0", "3.6", "5.9.9"],
    "dummy-project-03": ["1.0.0", "1.3.0"],
}


@pytest.fixture(scope="session", name="resource_dir")
def resource_dir_fixture() -> Path:
    """Returns the path to the test resource directory.

    Returns:
        Path: The resource directory path.
    """
    return Path(__file__).parent.joinpath("resources")


@pytest.fixture(scope="function", name="api")
def api_client_fixture() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="function", name="dummy_projects_dir")
def dummy_projects_dir_fixture(tmp_path: Path) -> Generator[Path, None, None]:
    with patch.dict(os.environ, {"VDOC_DOCS_DIR": str(tmp_path)}):
        for project_name, versions in DUMMY_DOCS_STRUCTURE.items():
            for version in versions:
                path = tmp_path / project_name / version
                path.mkdir(parents=True)

        # Create dummy hidden directory to make sure listing ignores this
        (tmp_path / ".dummy_hidden").mkdir()

        yield tmp_path
