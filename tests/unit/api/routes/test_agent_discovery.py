"""Contains all unit tests for the documents written for automated readers."""

import os
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch
from xml.etree import ElementTree as ET

import pytest
from fastapi.testclient import TestClient
from httpx import Response

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

    assert "## Page indexes" in body
    assert "http://testserver/static/projects/dummy-project-01/2.0.0/objects.inv" in body
    assert "http://testserver/static/projects/dummy-project-02/6.0/sitemap.xml" in body
    assert "dummy-project-03" not in body.split("## Page indexes")[1]


def test_llms_txt_does_not_call_the_page_indexes_optional(dummy_projects_dir: Path, api: TestClient) -> None:
    """`## Optional` is the one heading llmstxt.org defines, and it means the links under it are skippable."""
    (dummy_projects_dir / "dummy-project-01" / "2.0.0" / "objects.inv").write_text("dummy inventory")

    assert "## Optional" not in api.get("/llms.txt").text


def test_llms_txt_without_any_inventory_has_no_page_index_section(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    assert "## Page indexes" not in api.get("/llms.txt").text


def test_llms_txt_says_which_address_to_pass_on(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    """An agent that cites what it read must hand a person the readable address, not the static one."""
    body = api.get("/llms.txt").text

    assert "Quote the readable one." in body
    assert "Read from the static address, pass on the readable one." in body


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
    assert "Sitemap: http://testserver/sitemap.xml" in response.text
    assert "Disallow" not in response.text


def test_robots_txt_uses_the_forwarded_host(api: TestClient) -> None:
    body = api.get("/robots.txt", headers={"x-forwarded-proto": "https", "x-forwarded-host": "docs.example.com"}).text

    assert "https://docs.example.com/llms.txt" in body
    assert "https://docs.example.com/sitemap.xml" in body
    assert "testserver" not in body


def _sitemap_locations(response: Response) -> list[str]:
    """Returns the URL of every entry of a sitemap, parsed rather than matched as text."""
    namespace = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    root = ET.fromstring(response.text)  # noqa: S314

    return [element.text or "" for element in root.findall("sitemap:url/sitemap:loc", namespace)]


def test_sitemap_xml_is_served_as_xml(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/sitemap.xml")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/xml")


def test_sitemap_xml_lists_the_newest_version_of_every_project(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    locations = _sitemap_locations(api.get("/sitemap.xml"))

    assert locations == [
        "http://testserver/static/projects/dummy-project-01/2.0.0/index.html",
        "http://testserver/static/projects/dummy-project-02/6.0/index.html",
        "http://testserver/static/projects/dummy-project-03/2.0.0-beta/index.html",
    ]


def test_sitemap_xml_dates_an_entry_by_when_its_version_was_published(
    dummy_projects_dir: Path,
    api: TestClient,
) -> None:
    published_on = datetime.fromtimestamp(
        (dummy_projects_dir / "dummy-project-01" / "2.0.0").stat().st_mtime, tz=UTC
    ).date()

    assert f"<lastmod>{published_on.isoformat()}</lastmod>" in api.get("/sitemap.xml").text


def test_sitemap_xml_skips_a_version_without_a_page_to_enter_at(dummy_projects_dir: Path, api: TestClient) -> None:
    """An entry a crawler would receive a 404 for is worse than no entry at all."""
    (dummy_projects_dir / "dummy-project-02" / "6.0" / "index.html").unlink()

    assert not any("dummy-project-02" in location for location in _sitemap_locations(api.get("/sitemap.xml")))


def test_sitemap_xml_uses_the_forwarded_host_and_scheme(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/sitemap.xml", headers={"x-forwarded-proto": "https", "x-forwarded-host": "docs.example.com"})

    assert _sitemap_locations(response)[0].startswith("https://docs.example.com/")
    assert "testserver" not in response.text


def test_sitemap_xml_on_an_empty_instance(tmp_path: Path, request: pytest.FixtureRequest) -> None:
    """Nothing published is an empty sitemap, which is still a valid one."""
    with patch.dict(os.environ, {"VDOC_DOCS_DIR": str(tmp_path)}, clear=True):
        api: TestClient = request.getfixturevalue("api")
        response = api.get("/sitemap.xml")

    assert response.status_code == 200
    assert _sitemap_locations(response) == []


def test_llms_txt_before_the_docs_directory_exists(tmp_path: Path, request: pytest.FixtureRequest) -> None:
    """A deployment whose documentation volume has not been populated yet is empty, not broken."""
    with patch.dict(os.environ, {"VDOC_DOCS_DIR": str(tmp_path / "never-created")}, clear=True):
        api: TestClient = request.getfixturevalue("api")
        response = api.get("/llms.txt")

    assert response.status_code == 200
    assert response.text.startswith("# Documentation\n")
