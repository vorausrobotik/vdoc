"""Contains all authentication dependencies."""

import secrets
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from vdoc.exceptions import InvalidCredentials
from vdoc.settings import VDocSettings

security = HTTPBasic()


def require_authentication(credentials: Annotated[HTTPBasicCredentials, Depends(security)]) -> bool:
    """FastAPI dependency that checks for HTTP Basic Auth credentials in the request header.

    Args:
        credentials: The HTTPBasicAuth credentials sent with the request heder.

    Raises:
        HTTPException: If the credentials are not valid.

    Returns:
        True if the request is authenticated.
    """
    settings = VDocSettings()
    is_correct_username = secrets.compare_digest(credentials.username.encode("utf8"), settings.api_username)
    is_correct_password = secrets.compare_digest(credentials.password.encode("utf8"), settings.api_password)
    if not (is_correct_username and is_correct_password):
        raise InvalidCredentials()
    return True
