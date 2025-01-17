"""Contains integration tests for serving the static documentation files."""

from pathlib import Path

import requests

from tests.conftest import DUMMY_DOCS_STRUCTURE
from tests.utils import start_vdoc_server_and_get_uri
from vdoc.constants import CONFIG_ENV_PREFIX


def test_serve_static_projects(dummy_projects_dir: Path) -> None:
    with start_vdoc_server_and_get_uri(env={f"{CONFIG_ENV_PREFIX}DOCS_DIR": str(dummy_projects_dir)}) as server_uri:
        for project_name, versions in DUMMY_DOCS_STRUCTURE.items():
            for version in versions:
                result = requests.get(f"{server_uri}/static/projects/{project_name}/{version}", timeout=1)
                assert result.text == f"This is {version} of {project_name}"
