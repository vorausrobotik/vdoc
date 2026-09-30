"""Contains the project visibility model."""

from enum import StrEnum


class ProjectVisibility(StrEnum):
    """Who finds a project, and who can read it."""

    LISTED = "listed"
    """Shown on the landing page and in every index, and readable by anyone."""

    UNLISTED = "unlisted"
    """Left out of the landing page and every index, but still readable by anyone who has a link."""

    LOCKED = "locked"
    """Not readable at all. Every address of it answers as if the project did not exist."""
