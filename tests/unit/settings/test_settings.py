"""Contains all settings tests."""

import os
import re
from pathlib import Path
from unittest.mock import patch

import pytest

from vdoc.models.project_category import ProjectCategory
from vdoc.settings import VDocSettings


@patch.dict(os.environ, clear=True)
def test_vdoc_settings() -> None:
    settings = VDocSettings()
    assert settings.docs_dir == Path("/srv/vdoc/docs/")


@patch.dict(os.environ, {"VDOC_DOCS_DIR": "/tmp/foo"}, clear=True)
def test_vdoc_settings_patchable() -> None:
    settings = VDocSettings()
    assert settings.docs_dir == Path("/tmp/foo/")


@patch.dict(
    os.environ,
    {
        "VDOC_PROJECT_CATEGORIES": '[{"id": 1, "name": "General"}, {"id": 2, "name": "API"}]',
        "VDOC_PROJECT_CATEGORY_MAPPING": '{"dummy-project-01": "API"}',
    },
    clear=True,
)
def test_vdoc_settings_model_validation_project_categories() -> None:
    settings = VDocSettings()
    assert settings.project_categories == [ProjectCategory(id=1, name="General"), ProjectCategory(id=2, name="API")]
    assert settings.project_category_mapping == {"dummy-project-01": "API"}


def test_vdoc_settings_model_validation_project_categories_duplicate_name() -> None:
    with pytest.raises(ValueError, match=re.escape("Duplicate category names are not allowed in `project_categories`")):
        VDocSettings(project_categories=[ProjectCategory(id=1, name="General"), ProjectCategory(id=2, name="General")])


def test_vdoc_settings_model_validation_project_categories_duplicate_id() -> None:
    with pytest.raises(ValueError, match=re.escape("Duplicate category IDs are not allowed in `project_categories`")):
        VDocSettings(project_categories=[ProjectCategory(id=1, name="General"), ProjectCategory(id=1, name="API")])


@patch.dict(
    os.environ,
    {
        "VDOC_PROJECT_CATEGORIES": '[{"id": 1, "name": "General"}]',
        "VDOC_PROJECT_CATEGORY_MAPPING": '{"dummy-project-01": "Dummy"}',
    },
    clear=True,
)
def test_vdoc_settings_model_validation_project_categories_invalid_mapping() -> None:
    with pytest.raises(
        ValueError,
        match=re.escape("Category name 'Dummy' in `project_category_mapping` is not defined in `project_categories`"),
    ):
        VDocSettings()
