"""Contains all unit tests for the admin login."""

import os
from collections.abc import Generator
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.dependencies.models import Dependant
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from tests.utils import assert_api_response
from vdoc.constants import CONFIG_ENV_PREFIX

CREDENTIALS = {"username": "someone", "password": "secret"}


@pytest.fixture(name="configured_api")
def configured_api_fixture(api: TestClient) -> Generator[TestClient, None, None]:
    environment = {f"{CONFIG_ENV_PREFIX}API_USERNAME": "someone", f"{CONFIG_ENV_PREFIX}API_PASSWORD": "secret"}
    with patch.dict(os.environ, environment):
        # Over HTTPS, because the session cookie is secure and a client sends it back over HTTPS only
        api.base_url = "https://testserver"
        yield api


def test_login_session_admits_the_admin(configured_api: TestClient) -> None:
    assert configured_api.get("/api/auth/me").status_code == 401

    assert configured_api.post("/api/auth/login", json=CREDENTIALS).status_code == 204
    assert configured_api.get("/api/auth/me").json() == "someone"
    assert configured_api.get("/api/projects/", params={"include_hidden": True}).status_code == 200

    assert configured_api.post("/api/auth/logout").status_code == 204
    assert configured_api.get("/api/auth/me").status_code == 401


def test_login_session_uploads_a_version(
    configured_api: TestClient,
    dummy_projects_dir: Path,  # noqa: ARG001
    example_docs_zip: Path,
) -> None:
    """The admin page uploads with its login rather than with Basic credentials."""
    configured_api.post("/api/auth/login", json=CREDENTIALS)

    response = configured_api.post(
        "/api/projects/dummy-project-01/versions/9.0.0",
        files={"file": (example_docs_zip.name, example_docs_zip.read_bytes(), "application/zip")},
    )

    assert response.status_code == 201


def test_login_with_wrong_credentials(configured_api: TestClient) -> None:
    response = configured_api.post("/api/auth/login", json={**CREDENTIALS, "password": "wrong"})

    assert_api_response(response=response, status_code=401, message="Invalid username and/or password")
    assert "WWW-Authenticate" not in response.headers


def test_session_ends_when_the_credentials_change(configured_api: TestClient) -> None:
    configured_api.post("/api/auth/login", json=CREDENTIALS)

    with patch.dict(os.environ, {f"{CONFIG_ENV_PREFIX}API_USERNAME": "someone-else"}):
        from vdoc.settings import get_settings  # noqa: PLC0415

        get_settings.cache_clear()
        assert configured_api.get("/api/auth/me").status_code == 401
    get_settings.cache_clear()


def test_admin_without_credentials_does_not_challenge(configured_api: TestClient) -> None:
    """A challenge would make the browser show its own login dialog on top of the login page."""
    response = configured_api.get("/api/auth/me")

    assert response.status_code == 401
    assert "WWW-Authenticate" not in response.headers


def test_login_cookie_is_secure(configured_api: TestClient) -> None:
    cookie = configured_api.post("/api/auth/login", json=CREDENTIALS).headers["set-cookie"].lower()

    assert "secure" in cookie
    assert "httponly" in cookie
    assert "samesite=strict" in cookie


# Every route that needs authentication, with a body it would otherwise accept
GUARDED_REQUESTS = [
    ("GET", "/api/projects/?include_hidden=true", None),
    ("PUT", "/api/projects/dummy-project-01", {"name": "dummy-project-01"}),
    ("DELETE", "/api/projects/dummy-project-01", None),
    ("DELETE", "/api/projects/dummy-project-01/versions/1.0.0", None),
    ("POST", "/api/projects/dummy-project-01/versions/9.0.0", None),
    ("POST", "/api/project_categories/", {"name": "General"}),
    ("PUT", "/api/project_categories/1", {"name": "General"}),
    ("DELETE", "/api/project_categories/1", None),
    ("GET", "/api/auth/me", None),
    ("POST", "/api/auth/login", {"username": "admin", "password": "admin"}),
]


@pytest.mark.parametrize(("method", "path", "body"), GUARDED_REQUESTS)
def test_default_credentials_are_refused(
    method: str,
    path: str,
    body: dict[str, str] | None,
    dummy_projects_dir: Path,  # noqa: ARG001
    default_credentials_api: TestClient,
) -> None:
    """The default credentials are published, so they must not open anything."""
    response = default_credentials_api.request(method, path, json=body)

    assert response.status_code == 403
    assert "VDOC_API_USERNAME" in response.json()["message"]


@pytest.mark.parametrize(
    ("method", "path", "body"), [request for request in GUARDED_REQUESTS if "login" not in request[1]]
)
def test_guarded_routes_require_credentials(
    method: str,
    path: str,
    body: dict[str, str] | None,
    dummy_projects_dir: Path,  # noqa: ARG001
    configured_api: TestClient,
) -> None:
    assert configured_api.request(method, path, json=body).status_code == 401


def test_every_write_route_is_guarded(api: TestClient) -> None:
    """A route added later without a guard fails here rather than in production."""
    unguarded = []
    for prefix, route in _api_routes(api):
        path, writes = f"{prefix}{route.path}", (route.methods or set()) - {"GET", "HEAD"}
        guards = {"require_admin", "require_authentication"} & set(_dependency_names(route.dependant))
        if writes and path not in PUBLIC_WRITE_ROUTES and not guards:
            unguarded.append(f"{','.join(sorted(writes))} {path}")

    assert unguarded == []


# Logging in and out is what a request does before it has, or after it had, credentials
PUBLIC_WRITE_ROUTES = {"/api/auth/login", "/api/auth/logout"}


def _api_routes(api: TestClient) -> list[tuple[str, APIRoute]]:
    fastapi_app = api.app.application  # type: ignore[attr-defined]
    return [
        (included.include_context.prefix, route)
        for included in fastapi_app.routes
        if hasattr(included, "original_router")
        for route in included.original_router.routes
        if isinstance(route, APIRoute)
    ]


def _dependency_names(dependant: Dependant) -> list[str]:
    names = []
    for dependency in dependant.dependencies:
        names.append(getattr(dependency.call, "__name__", ""))
        names.extend(_dependency_names(dependency))
    return names


def test_admin_pages_may_not_be_framed_or_indexed(webapp_index: Path, api: TestClient) -> None:  # noqa: ARG001
    headers = api.get("/admin/projects").headers

    assert headers["content-security-policy"] == "frame-ancestors 'none'"
    assert headers["x-frame-options"] == "DENY"
    assert headers["x-robots-tag"] == "noindex, nofollow"


def test_login_regenerates_the_session_id(configured_api: TestClient) -> None:
    """A session id planted before the login must not be the one that is logged in."""
    response = configured_api.post("/api/auth/login", json=CREDENTIALS, headers={"cookie": "session=planted"})

    assert response.cookies.get("session") not in {None, "planted"}


def test_logout_ends_the_session_for_good(configured_api: TestClient) -> None:
    """A copy of the cookie made before logging out must not work after it."""
    configured_api.post("/api/auth/login", json=CREDENTIALS)
    copied = configured_api.cookies.get("session")
    configured_api.post("/api/auth/logout")

    configured_api.cookies.clear()
    configured_api.cookies.set("session", copied)

    assert configured_api.get("/api/auth/me").status_code == 401
