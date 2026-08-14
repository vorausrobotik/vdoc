"""Contains all unit tests for misc functionalities of REST API."""

import gzip
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

BUNDLE_CONTENT = "console.log('the bundle itself');\n" * 100


@patch("vdoc.api.routes.version.get_app_version")
def test_api_get_app_version(get_app_version_mock: MagicMock, api: TestClient) -> None:
    get_app_version_mock.return_value = "42.0.0"
    assert api.get("/api/version/").json() == "42.0.0"


def test_sphinx_inventory(dummy_projects_dir: Path, api: TestClient) -> None:
    inventory_file_mock = dummy_projects_dir / "dummy-project-01" / "2.0.0" / "objects.inv"
    inventory_file_mock.write_text("dummy objects.inv content")
    response = api.get("/dummy-project-01/latest/objects.inv")
    assert response.status_code == 200
    assert response.text == "dummy objects.inv content"


def test_sphinx_inventory_non_existing_project(api: TestClient) -> None:
    response = api.get("/dummy-project-01/latest/objects.inv")
    assert response.status_code == 404


def test_sphinx_inventory_not_shipped_by_the_version(dummy_projects_dir: Path, api: TestClient) -> None:
    """A version built by a generator other than Sphinx has no inventory, which is a 404, not a 500."""
    assert (dummy_projects_dir / "dummy-project-01" / "2.0.0").is_dir()

    response = api.get("/dummy-project-01/latest/objects.inv")

    assert response.status_code == 404
    assert response.json() == {
        "message": "Version '2.0.0' of project 'dummy-project-01' doesn't contain a 'objects.inv' file."
    }


def test_serve_frontend_assets(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, api: TestClient) -> None:
    (tmp_path / "style.css").write_text("dummy style sheet")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)
    response = api.get("/style.css")
    assert response.status_code == 200
    assert response.text == "dummy style sheet"


@pytest.fixture(name="built_webapp")
def built_webapp_fixture(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    """A web UI directory shaped like a build, with the compressed copies the build writes.

    The bundle is padded because a compressed copy that is not smaller than the file it stands in for is
    not worth sending, and is skipped.
    """
    assets = tmp_path / "assets"
    assets.mkdir()
    (assets / "index-DdV67ccn.js").write_text(BUNDLE_CONTENT)
    (assets / "index-DdV67ccn.js.br").write_bytes(b"standing in for brotli, which this client cannot read")
    (assets / "index-DdV67ccn.js.gz").write_bytes(gzip.compress(b"the bundle, compressed at build time"))
    (tmp_path / "index.html").write_text("dummy index.html content")

    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)

    return tmp_path


def test_serve_frontend_assets_sends_the_compressed_copy(
    built_webapp: Path,  # noqa: ARG001
    request: pytest.FixtureRequest,
) -> None:
    """The build compresses every asset once; a request only picks the copy the client can read."""
    # The web UI is indexed when the app is built, so the app comes after the directory exists
    api: TestClient = request.getfixturevalue("api")

    response = api.get("/assets/index-DdV67ccn.js", headers={"accept-encoding": "gzip"})

    assert response.status_code == 200
    assert response.headers["content-encoding"] == "gzip"
    assert response.headers["vary"] == "Accept-Encoding"
    assert response.headers["content-type"].startswith("text/javascript")
    assert response.text == "the bundle, compressed at build time"


def test_serve_frontend_assets_prefers_brotli(built_webapp: Path, request: pytest.FixtureRequest) -> None:  # noqa: ARG001
    """Both copies exist, so which one is sent is the client's preference rather than what is on disk."""
    api: TestClient = request.getfixturevalue("api")

    # Asked without a body, because this client has no brotli decoder to read one with
    response = api.head("/assets/index-DdV67ccn.js", headers={"accept-encoding": "br, gzip"})

    assert response.headers["content-encoding"] == "br"


def test_serve_frontend_assets_without_a_matching_encoding(
    built_webapp: Path,  # noqa: ARG001
    request: pytest.FixtureRequest,
) -> None:
    api: TestClient = request.getfixturevalue("api")

    response = api.get("/assets/index-DdV67ccn.js", headers={"accept-encoding": "identity"})

    assert "content-encoding" not in response.headers
    assert response.text == BUNDLE_CONTENT


def test_serve_frontend_assets_cache_lifetimes(built_webapp: Path, request: pytest.FixtureRequest) -> None:  # noqa: ARG001
    """A name carrying a content hash can be kept forever; the document naming it cannot."""
    api: TestClient = request.getfixturevalue("api")

    hashed = api.get("/assets/index-DdV67ccn.js", headers={"accept-encoding": "identity"})
    shell = api.get("/index.html")

    assert "immutable" in hashed.headers["cache-control"]
    assert "immutable" not in shell.headers["cache-control"]


def test_serve_frontend_assets_rejects_path_traversal(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, api: TestClient
) -> None:
    """A request path is untrusted input, and nothing outside the web UI directory is ours to serve."""
    (tmp_path / "webapp").mkdir()
    (tmp_path / "webapp" / "index.html").write_text("dummy index.html content")
    (tmp_path / "secret.txt").write_text("not ours to serve")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path / "webapp")

    response = api.get("/%2e%2e%2fsecret.txt")

    assert response.status_code == 404
    assert response.text == "dummy index.html content"


@pytest.mark.parametrize(
    ("path", "expected_status_code"),
    [
        ("/", 200),
        ("/dummy-project-01", 200),
        ("/dummy-project-01/1.0.0", 200),
        ("/dummy-project-01/latest", 200),
        # The page is not checked, because a single page documentation has no file for most of its pages
        ("/dummy-project-01/1.0.0/any/page/it/routes/itself", 200),
        ("/not-a-project", 404),
        ("/not-a-project/1.0.0", 404),
        ("/dummy-project-01/9.9.9", 404),
        ("/dummy-project-01/not-a-version", 404),
        # A conventional root file vdoc does not serve. The ones it does -- `/robots.txt`, `/llms.txt`
        # and `/sitemap.xml` -- never reach this route, see test_agent_discovery.py
        ("/humans.txt", 404),
    ],
)
def test_serve_frontend_index_status_codes(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    dummy_projects_dir: Path,  # noqa: ARG001
    api: TestClient,
    path: str,
    expected_status_code: int,
) -> None:
    """The UI is always returned, but only a path the UI has a route for is returned as a success."""
    (tmp_path / "index.html").write_text("dummy index.html content")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)

    response = api.get(path)

    assert response.status_code == expected_status_code
    assert response.text == "dummy index.html content"


@pytest.mark.parametrize(
    ("path", "expected_link"),
    [
        (
            "/dummy-project-01/1.0.0/api.html",
            '</static/projects/dummy-project-01/1.0.0/api.html>; rel="alternate"; type="text/html"',
        ),
        (
            "/dummy-project-01/latest/guide/page.html",
            '</static/projects/dummy-project-01/latest/guide/page.html>; rel="alternate"; type="text/html"',
        ),
        # The version alone is a page too: it is the version's index
        (
            "/dummy-project-01/1.0.0",
            '</static/projects/dummy-project-01/1.0.0>; rel="alternate"; type="text/html"',
        ),
        # vdoc's own pages, which no published file stands behind
        ("/", None),
        ("/dummy-project-01", None),
        # Nothing published answers this, so there is nothing to point at
        ("/not-a-project/1.0.0/index.html", None),
    ],
)
def test_serve_frontend_index_points_at_the_static_address(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    dummy_projects_dir: Path,  # noqa: ARG001
    api: TestClient,
    path: str,
    expected_link: str | None,
) -> None:
    """The shell says where the page itself is, for a client that reached the readable address first."""
    (tmp_path / "index.html").write_text("dummy index.html content")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)

    response = api.get(path)

    assert response.headers.get("link") == expected_link


def test_serve_frontend_index_encodes_the_static_address(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    dummy_projects_dir: Path,  # noqa: ARG001
    api: TestClient,
) -> None:
    """The path is composed into a header, so what a header may not contain must not survive into one."""
    (tmp_path / "index.html").write_text("dummy index.html content")
    monkeypatch.setattr("vdoc.api.lifespan.webapp_path", tmp_path)

    response = api.get("/dummy-project-01/1.0.0/a%20page%3E.html")

    assert response.headers["link"].startswith("</static/projects/dummy-project-01/1.0.0/a%20page%3E.html>")


def test_static_latest_redirects_to_the_published_version(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/static/projects/dummy-project-01/latest/index.html", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/projects/dummy-project-01/2.0.0/index.html"


def test_static_latest_serves_the_file_it_redirects_to(dummy_projects_dir: Path, api: TestClient) -> None:  # noqa: ARG001
    response = api.get("/static/projects/dummy-project-01/latest/index.html")

    assert response.status_code == 200
    assert response.text == "This is 2.0.0 of dummy-project-01"


def test_static_latest_of_an_unknown_project(api: TestClient) -> None:
    response = api.get("/static/projects/not-a-project/latest/index.html", follow_redirects=False)

    assert response.status_code == 404
