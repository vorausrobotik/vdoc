"""This module contains pytest fixtures."""

import os
import sys
from pathlib import Path
from subprocess import check_output
from tempfile import TemporaryDirectory
from typing import Generator
from unittest.mock import patch
from zipfile import ZipFile

import pytest
from fastapi.testclient import TestClient
from httpx import BasicAuth
from typer.testing import CliRunner

from tests.utils import start_vdoc_server_and_get_uri
from vdoc.api import app
from vdoc.constants import CONFIG_ENV_PREFIX, DEFAULT_API_PASSWORD, DEFAULT_API_USERNAME

DUMMY_VERSIONS = (
    ("0.0.1", "0.0.2", "0.1.0", "1.0.0", "1.1.0", "2.0.0"),
    ("6.0", "1.0", "3.6", "5.9.9"),
    ("1.0.0", "1.3.0", "2.0.0-beta"),
)

DUMMY_DOCS_STRUCTURE = {
    "dummy-project-01": DUMMY_VERSIONS[0],
    "dummy-project-02": DUMMY_VERSIONS[1],
    "dummy-project-03": DUMMY_VERSIONS[2],
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


@pytest.fixture(scope="function", name="authenticated_api")
def authenticated_api_client_fixture(api: TestClient) -> TestClient:
    api.auth = BasicAuth(username=DEFAULT_API_USERNAME, password=DEFAULT_API_PASSWORD)
    return api


@pytest.fixture(scope="session", name="cli_runner")
def cli_runner_fixture() -> CliRunner:
    """Returns a typer/click CliRunner with increased terminal width.

    Returns:
        The CliRunner object for testing the CLI.
    """
    return CliRunner(env={"COLUMNS": "120"})


@pytest.fixture(scope="function", name="dummy_projects_dir")
def dummy_projects_dir_fixture(tmp_path: Path) -> Generator[Path, None, None]:
    with patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX}DOCS_DIR": str(tmp_path)}):
        for project_name, versions in DUMMY_DOCS_STRUCTURE.items():
            for version in versions:
                path = tmp_path / project_name / version
                path.mkdir(parents=True)
                (path / "index.html").write_text(f"This is {version} of {project_name}")

        # Create dummy hidden directory to make sure listing ignores this
        (tmp_path / ".dummy_hidden").mkdir()

        yield tmp_path


@pytest.fixture(scope="function", name="example_docs_zip")
def example_docs_zip_fixture(tmp_path: Path) -> Generator[Path, None, None]:
    zip_file_path = tmp_path / "test_file.zip"
    html_file_content = b"<html><body>Test File</body></html>"

    with ZipFile(file=zip_file_path, mode="w") as archive:
        archive.writestr("index.html", html_file_content)

    yield zip_file_path


@pytest.fixture(scope="session", name="sample_docs")
def sample_docs_fixture(resource_dir: Path) -> Generator[Path, None, None]:

    def build_project_docs(project_root: Path, target_root_dir: Path, version: str) -> None:
        check_output(
            args=[
                f"{Path(sys.executable).parent}/sphinx-build",
                "-b",
                "html",
                project_root.as_posix(),
                (target_root_dir / version).as_posix(),
            ],
            env={"INJECTED_VERSION": version},
        )

    with TemporaryDirectory() as _tmp_dir:
        tmp_dir = Path(_tmp_dir)
        sample_docs_root = resource_dir / "sample-docs"
        sample_doc_projects = sorted(list(sample_docs_root.glob("project*")))
        assert len(sample_doc_projects) == 2, "Expected 2 sample projects"
        for index, project_root in enumerate(sample_doc_projects):
            project_name = project_root.name
            for version in DUMMY_VERSIONS[index]:
                build_project_docs(project_root, tmp_dir / project_name, version)

        with start_vdoc_server_and_get_uri(env={f"{CONFIG_ENV_PREFIX}DOCS_DIR": str(tmp_dir)}):
            for version in DUMMY_VERSIONS[2]:
                build_project_docs(sample_docs_root / "meta-project", tmp_dir / "meta-project", version)

        yield tmp_dir
