"""This module contains utility functions for tests."""

from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from httpx import Response


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
