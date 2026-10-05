"""Contains all unit tests for the project categories REST API."""

import pytest
from fastapi.testclient import TestClient

from tests.utils import assert_api_response
from vdoc.models.project_category import ProjectCategory


def test_list_project_categories_route(api: TestClient) -> None:
    components = ProjectCategory.create(name="Components")
    general = ProjectCategory.create(name="General")

    response = api.get("/api/project_categories/")

    assert response.json() == [
        {"id": components.id, "name": "Components", "position": 0},
        {"id": general.id, "name": "General", "position": 1},
    ]


def test_project_category_lifecycle(authenticated_api: TestClient) -> None:
    created = authenticated_api.post("/api/project_categories/", json={"name": "General"})
    assert created.status_code == 201
    category_id = created.json()["id"]

    renamed = authenticated_api.put(f"/api/project_categories/{category_id}", json={"name": "Basics"})
    assert renamed.json() == {"id": category_id, "name": "Basics", "position": 0}

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


def test_reorder_project_categories(authenticated_api: TestClient) -> None:
    components = ProjectCategory.create(name="Components")
    general = ProjectCategory.create(name="General")
    tools = ProjectCategory.create(name="Tools")

    response = authenticated_api.put(
        "/api/project_categories/order", json={"category_ids": [tools.id, components.id, general.id]}
    )

    assert response.status_code == 200
    assert [category.name for category in ProjectCategory.all()] == ["Tools", "Components", "General"]


def test_category_created_after_a_reorder_comes_last(authenticated_api: TestClient) -> None:
    components = ProjectCategory.create(name="Components")
    general = ProjectCategory.create(name="General")
    authenticated_api.put("/api/project_categories/order", json={"category_ids": [general.id, components.id]})

    ProjectCategory.create(name="Tools")

    assert [category.name for category in ProjectCategory.all()] == ["General", "Components", "Tools"]


@pytest.mark.parametrize(
    "category_ids",
    [pytest.param([0], id="missing"), pytest.param([0, 1, 1], id="duplicate"), pytest.param([0, 1, 42], id="unknown")],
)
def test_reorder_project_categories_rejects_an_incomplete_order(
    category_ids: list[int], authenticated_api: TestClient
) -> None:
    created = [ProjectCategory.create(name="Components"), ProjectCategory.create(name="General")]
    ids = [created[index].id if index < len(created) else index for index in category_ids]

    response = authenticated_api.put("/api/project_categories/order", json={"category_ids": ids})

    assert_api_response(response=response, status_code=422, message="The order must list every category exactly once.")
    assert [category.name for category in ProjectCategory.all()] == ["Components", "General"]


@pytest.mark.parametrize("method", ["put", "delete"])
def test_project_category_not_found(method: str, authenticated_api: TestClient) -> None:
    response = authenticated_api.request(method, "/api/project_categories/42", json={"name": "General"})

    assert_api_response(response=response, status_code=404, message="Category '42' doesn't exist.")
