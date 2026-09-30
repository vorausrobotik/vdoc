"""Contains all authentication dependencies."""

import secrets
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from vdoc.constants import SESSION_USER_KEY
from vdoc.exceptions import DefaultCredentialsInUse, InvalidCredentials
from vdoc.settings import get_settings

# Not raising by itself, so a route that only sometimes needs credentials can still read them
security = HTTPBasic(auto_error=False)

Credentials = Annotated[HTTPBasicCredentials | None, Depends(security)]


def credentials_match(credentials: HTTPBasicCredentials) -> bool:
    """Reports whether credentials are the configured API credentials.

    Args:
        credentials: The credentials to check.

    Returns:
        True if they match, False otherwise.
    """
    settings = get_settings()
    is_correct_username = secrets.compare_digest(credentials.username.encode("utf8"), settings.api_username)
    is_correct_password = secrets.compare_digest(credentials.password.encode("utf8"), settings.api_password)
    return is_correct_username and is_correct_password


def refuse_default_credentials() -> None:
    """Refuses every authenticated request while the default credentials are in use.

    They are published, so anyone could otherwise upload, rename, hide, lock or delete projects.

    Raises:
        DefaultCredentialsInUse: If the default credentials are in use.
    """
    if get_settings().uses_default_credentials:
        raise DefaultCredentialsInUse


def require_authentication(credentials: Credentials) -> bool:
    """FastAPI dependency that checks for HTTP Basic Auth credentials in the request header.

    Args:
        credentials: The HTTPBasicAuth credentials sent with the request header, if any.

    Raises:
        InvalidCredentials: If the credentials are missing or not valid.

    Returns:
        True if the request is authenticated.
    """
    refuse_default_credentials()
    if credentials is None or not credentials_match(credentials=credentials):
        raise InvalidCredentials
    return True


def require_admin(request: Request, credentials: Credentials) -> bool:
    """FastAPI dependency that admits the admin, logged in on the login page or sending Basic credentials.

    Args:
        request: The request, whose session holds the login.
        credentials: The HTTPBasicAuth credentials sent with the request header, if any.

    Raises:
        InvalidCredentials: If the request is neither logged in nor sends valid credentials.

    Returns:
        True if the request is admitted.
    """
    refuse_default_credentials()
    # Compared with the configured name rather than only looked up, so a changed username ends every
    # session even with a store that outlives a restart
    if request.session.get(SESSION_USER_KEY) == get_settings().api_username.decode("utf8"):
        return True
    if credentials is None:
        # Without a challenge, because the web UI asks on its own login page, and a challenge would
        # make the browser show its own login dialog on top of it
        raise InvalidCredentials(challenge=False)
    return require_authentication(credentials=credentials)
