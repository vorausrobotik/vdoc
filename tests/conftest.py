"""This module contains pytest fixtures."""

import os
import sys
from collections.abc import Generator
from pathlib import Path
from subprocess import check_output
from tempfile import TemporaryDirectory
from unittest.mock import patch
from zipfile import ZipFile

import pytest
from fastapi.testclient import TestClient
from httpx import BasicAuth
from typer.testing import CliRunner

from tests.utils import start_vdoc_server_and_get_uri
from vdoc.api import create_app
from vdoc.constants import CONFIG_ENV_PREFIX, DEFAULT_API_PASSWORD, DEFAULT_API_USERNAME
from vdoc.settings import get_settings

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


@pytest.hookimpl(wrapper=True)
def pytest_runtest_call(item: pytest.Item) -> Generator[None, object, object]:  # noqa: ARG001
    """Rebuilds the settings around every test body.

    ``get_settings`` reads the environment and the configuration file once, because a deployed vdoc
    cannot have either changed under it. Tests do exactly that, and they do it inside the test rather
    than before it -- with a decorator, or with ``patch.dict`` -- which is after the fixtures that build
    the app have already read the settings once.

    Clearing at this point rather than in an autouse fixture is what makes that work: fixtures are all
    set up by now, so the next read is the one the test itself triggers, under the environment the test
    set. Clearing again afterwards keeps the next test from inheriting it.

    Args:
        item: The test being run. Unread: this applies to all of them.

    Yields:
        To the test body.

    Returns:
        Whatever the test body returned.
    """
    get_settings.cache_clear()
    try:
        return (yield)
    finally:
        get_settings.cache_clear()


@pytest.fixture(scope="session", name="resource_dir")
def resource_dir_fixture() -> Path:
    """Returns the path to the test resource directory.

    Returns:
        Path: The resource directory path.
    """
    return Path(__file__).parent.joinpath("resources")


@pytest.fixture(name="api")
def api_client_fixture() -> Generator[TestClient, None, None]:
    with TestClient(create_app()) as client:
        yield client


@pytest.fixture(name="authenticated_api")
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


@pytest.fixture(name="dummy_projects_dir")
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


@pytest.fixture(name="example_docs_zip")
def example_docs_zip_fixture(tmp_path: Path) -> Path:
    zip_file_path = tmp_path / "test_file.zip"
    html_file_content = b"<html><body>Test File</body></html>"

    with ZipFile(file=zip_file_path, mode="w") as archive:
        archive.writestr("index.html", html_file_content)

    return zip_file_path


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
        sample_doc_projects = sorted(sample_docs_root.glob("project*"))
        assert len(sample_doc_projects) == 2, "Expected 2 sample projects"
        for index, project_root in enumerate(sample_doc_projects):
            project_name = project_root.name
            for version in DUMMY_VERSIONS[index]:
                build_project_docs(project_root, tmp_dir / project_name, version)

        with start_vdoc_server_and_get_uri(env={f"{CONFIG_ENV_PREFIX}DOCS_DIR": str(tmp_dir)}):
            for version in DUMMY_VERSIONS[2]:
                build_project_docs(sample_docs_root / "meta-project", tmp_dir / "meta-project", version)

        yield tmp_dir
