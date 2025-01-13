"""This module contains utility functions for tests."""

import sys
from contextlib import contextmanager
from pathlib import Path
from subprocess import Popen
from typing import Generator

import requests
from httpx import Response
from tenacity import retry, stop_after_attempt, wait_fixed

from vdoc.constants import CONFIG_ENV_PREFIX, DEFAULT_BIND_ADDRESS, DEFAULT_BIND_PORT


def assert_api_response(response: Response, status_code: int = 200, message: str | None = None) -> None:
    assert response.status_code == status_code
    if message:
        if status_code < 400:
            assert response.json() == message
        else:
            assert response.json()["message"] == message


@contextmanager
def ensure_project_dir_not_created(base_dir: Path, name: str, version: str) -> Generator[None, None, None]:
    project_dir = base_dir / name / version
    assert not project_dir.is_dir()
    yield
    assert not project_dir.is_dir()


@contextmanager
def start_vdoc_server_and_get_uri(env: dict[str, str] | None = None) -> Generator[str, None, None]:
    env = env or {}
    env.update(
        {
            f"{CONFIG_ENV_PREFIX}BIND_ADDRESS": DEFAULT_BIND_ADDRESS,
            f"{CONFIG_ENV_PREFIX}BIND_PORT": str(DEFAULT_BIND_PORT),
        }
    )

    server_uri = f"http://{DEFAULT_BIND_ADDRESS}:{DEFAULT_BIND_PORT}"

    @retry(wait=wait_fixed(0.5), stop=stop_after_attempt(5))
    def wait_until_server_is_available() -> None:
        result = requests.get(server_uri, timeout=1)
        assert result.status_code == 200

    with Popen(args=[f"{Path(sys.executable).parent}/vdoc", "run"], env=env) as process:
        wait_until_server_is_available()
        yield server_uri
        process.kill()
