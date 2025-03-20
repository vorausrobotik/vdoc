"""Contains the project category model."""

from typing import Annotated

from pydantic import BaseModel, Field


class ProjectCategory(BaseModel):
    """Pydantic model for a project category."""

    id: Annotated[int, Field(ge=0)]
    name: str
