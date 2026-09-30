"""Contains the routes of the admin login."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from fastapi.security import HTTPBasicCredentials
from starsessions import regenerate_session_id

from vdoc.api.dependencies.auth import credentials_match, refuse_default_credentials, require_admin
from vdoc.constants import SESSION_USER_KEY
from vdoc.exceptions import InvalidCredentials
from vdoc.settings import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
def login(request: Request, credentials: HTTPBasicCredentials) -> None:
    """Logs the admin in, with a session cookie.

    Args:
        request: The request, whose session is to hold the login.
        credentials: The API credentials.

    Raises:
        InvalidCredentials: If the credentials are not valid.
    """
    refuse_default_credentials()
    if not credentials_match(credentials=credentials):
        raise InvalidCredentials(challenge=False)
    # A new id for every login, so a session id planted before it cannot be used after it
    regenerate_session_id(request)
    request.session[SESSION_USER_KEY] = credentials.username


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request) -> None:
    """Logs the admin out.

    Args:
        request: The request, whose session holds the login.
    """
    request.session.clear()


@router.get("/me")
def current_user(_: Annotated[bool, Depends(require_admin)]) -> str:
    """Returns the name of the admin, to tell whether the request is logged in.

    Returns:
        The username.
    """
    return get_settings().api_username.decode("utf8")
