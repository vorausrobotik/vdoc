"""Contains all unit tests for the documents written for automated readers."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from vdoc.constants import CONFIG_ENV_PREFIX_PLUGINS


def test_llms_txt_is_served_as_plain_text(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/llms.txt")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")


def test_llms_txt_lists_the_newest_version_of_every_project(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    body = api.get("/llms.txt").text

    assert "- [dummy-project-01 2.0.0](http://testserver/static/projects/dummy-project-01/2.0.0/index.html)" in body
    assert "- [dummy-project-02 6.0](http://testserver/static/projects/dummy-project-02/6.0/index.html)" in body
    # Superseded versions are deliberately not listed, the versions API enumerates them
    assert "1.0.0/index.html" not in body
    assert "the newest of 6 published versions" in body


def test_llms_txt_explains_both_addresses(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    body = api.get("/llms.txt").text

    assert "/static/projects/<project>/<version>/<page>" in body
    assert "/static/projects/<project>/latest/index.html" in body
    assert "http://testserver/openapi.json" in body


def test_llms_txt_falls_back_to_a_generic_heading(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    """An instance that has not named itself still needs a heading."""
    assert api.get("/llms.txt").text.startswith("# Documentation\n")


def test_llms_txt_uses_the_site_plugin(dummy_projects_dir: Path, request: pytest.FixtureRequest) -> None:  # noqa: ARG001
    environment = {
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_TITLE": "Example Documentation",
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_DESCRIPTION": "Everything about the platform.",
        f"{CONFIG_ENV_PREFIX_PLUGINS}SITE_LONG_DESCRIPTION": '["- **example.core**", "- **example.pioneer**"]',
    }
    with patch.dict(os.environ, environment):
        # The plugin reads its configuration when the app is created, so the app comes after the patch
        api: TestClient = request.getfixturevalue("api")
        body = api.get("/llms.txt").text

    assert body.startswith("# Example Documentation\n\n> Everything about the platform.\n")
    assert "- **example.core**\n- **example.pioneer**" in body


def test_llms_txt_uses_the_forwarded_host_and_scheme(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    body = api.get("/llms.txt", headers={"x-forwarded-proto": "https", "x-forwarded-host": "docs.example.com"}).text

    assert "https://docs.example.com/static/projects/dummy-project-01/2.0.0/index.html" in body
    assert "testserver" not in body


def test_llms_txt_advertises_only_the_inventories_that_exist(dummy_projects_dir: Path, api: TestClient) -> None:
    (dummy_projects_dir / "dummy-project-01" / "2.0.0" / "objects.inv").write_text("dummy inventory")
    (dummy_projects_dir / "dummy-project-02" / "6.0" / "sitemap.xml").write_text("<urlset/>")

    body = api.get("/llms.txt").text

    assert "## Optional" in body
    assert "http://testserver/static/projects/dummy-project-01/2.0.0/objects.inv" in body
    assert "http://testserver/static/projects/dummy-project-02/6.0/sitemap.xml" in body
    assert "dummy-project-03" not in body.split("## Optional")[1]


def test_llms_txt_without_any_inventory_has_no_optional_section(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    assert "## Optional" not in api.get("/llms.txt").text


def test_llms_txt_groups_projects_into_configured_categories(
    dummy_projects_dir: Path, request: pytest.FixtureRequest
) -> None:
    environment = {
        "VDOC_DOCS_DIR": str(dummy_projects_dir),
        "VDOC_PROJECT_CATEGORIES": '[{"id": 1, "name": "Components"}, {"id": 0, "name": "General"}]',
        "VDOC_PROJECT_CATEGORY_MAPPING": '{"dummy-project-01": "General"}',
    }
    with patch.dict(os.environ, environment):
        api: TestClient = request.getfixturevalue("api")
        body = api.get("/llms.txt").text

    # The categorized project gets its own section, and the uncategorized rest trails it
    assert "## Components" not in body, "A category without projects gets no empty section"
    assert body.index("## General") < body.index("dummy-project-01") < body.index("## Projects")


def test_llms_txt_skips_projects_without_a_version(dummy_projects_dir: Path, api: TestClient) -> None:
    """One unusable project directory must not take the whole index down."""
    (dummy_projects_dir / "empty-project").mkdir()

    body = api.get("/llms.txt").text

    assert "empty-project" not in body
    assert "dummy-project-01" in body


def test_llms_txt_on_an_empty_instance(tmp_path: Path, request: pytest.FixtureRequest) -> None:
    with patch.dict(os.environ, {"VDOC_DOCS_DIR": str(tmp_path)}, clear=True):
        api: TestClient = request.getfixturevalue("api")
        response = api.get("/llms.txt")

    assert response.status_code == 200
    assert response.text.startswith("# Documentation\n")
    assert "## " not in response.text


def test_llms_txt_follows_an_upload(
    dummy_projects_dir: Path,  # noqa: ARG001
    authenticated_api: TestClient,
    example_docs_zip: Path,
) -> None:
    """A version published while vdoc runs has to show up, so nothing about it may be cached for long."""
    assert "3.0.0" not in authenticated_api.get("/llms.txt").text

    response = authenticated_api.post(
        "/api/projects/dummy-project-01/versions/3.0.0",
        files={"file": ("docs.zip", example_docs_zip.read_bytes(), "application/zip")},
    )
    assert response.status_code == 201

    body = authenticated_api.get("/llms.txt").text
    assert "http://testserver/static/projects/dummy-project-01/3.0.0/index.html" in body
    assert "the newest of 7 published versions" in body


def test_robots_txt_allows_everything_and_points_at_llms_txt(api: TestClient) -> None:
    response = api.get("/robots.txt")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "User-agent: *" in response.text
    assert "Allow: /" in response.text
    assert "http://testserver/llms.txt" in response.text
    assert "Disallow" not in response.text


def test_robots_txt_uses_the_forwarded_host(api: TestClient) -> None:
    body = api.get("/robots.txt", headers={"x-forwarded-proto": "https", "x-forwarded-host": "docs.example.com"}).text

    assert "https://docs.example.com/llms.txt" in body
    assert "testserver" not in body


def test_llms_txt_before_the_docs_directory_exists(tmp_path: Path, request: pytest.FixtureRequest) -> None:
    """A deployment whose documentation volume has not been populated yet is empty, not broken."""
    with patch.dict(os.environ, {"VDOC_DOCS_DIR": str(tmp_path / "never-created")}, clear=True):
        api: TestClient = request.getfixturevalue("api")
        response = api.get("/llms.txt")

    assert response.status_code == 200
    assert response.text.startswith("# Documentation\n")
