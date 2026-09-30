"""Contains all unit tests for the project categories REST API."""

import pytest
from fastapi.testclient import TestClient

from tests.utils import assert_api_response
from vdoc.models.project_category import ProjectCategory


def test_list_project_categories_route(api: TestClient) -> None:
    components = ProjectCategory.create(name="Components")
    general = ProjectCategory.create(name="General")

    response = api.get("/api/project_categories/")

    assert response.json() == [{"id": components.id, "name": "Components"}, {"id": general.id, "name": "General"}]


def test_project_category_lifecycle(authenticated_api: TestClient) -> None:
    created = authenticated_api.post("/api/project_categories/", json={"name": "General"})
    assert created.status_code == 201
    category_id = created.json()["id"]

    renamed = authenticated_api.put(f"/api/project_categories/{category_id}", json={"name": "Basics"})
    assert renamed.json() == {"id": category_id, "name": "Basics"}

    assert authenticated_api.delete(f"/api/project_categories/{category_id}").status_code == 204
    assert ProjectCategory.all() == []


def test_project_category_duplicate_name(authenticated_api: TestClient) -> None:
    ProjectCategory.create(name="General")

    response = authenticated_api.post("/api/project_categories/", json={"name": "General"})

    assert_api_response(response=response, status_code=409, message="Category 'General' already exists.")


def test_project_category_rename_to_existing_name(authenticated_api: TestClient) -> None:
    ProjectCategory.create(name="General")
    other = ProjectCategory.create(name="Other")

    response = authenticated_api.put(f"/api/project_categories/{other.id}", json={"name": "General"})

    assert_api_response(response=response, status_code=409, message="Category 'General' already exists.")


@pytest.mark.parametrize("method", ["put", "delete"])
def test_project_category_not_found(method: str, authenticated_api: TestClient) -> None:
    response = authenticated_api.request(method, "/api/project_categories/42", json={"name": "General"})

    assert_api_response(response=response, status_code=404, message="Category '42' doesn't exist.")
