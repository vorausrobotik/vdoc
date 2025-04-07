"""Contains all unit tests for the project categories REST API."""

import os
from unittest.mock import patch

from fastapi.testclient import TestClient


@patch.dict(os.environ, {"VDOC_PROJECT_CATEGORIES": '[{"id": 1, "name": "General"}]'}, clear=True)
def test_list_project_categories_route(api: TestClient) -> None:
    response = api.get("/api/project_categories/")
    assert response.json() == [{"name": "General", "id": 1}]
