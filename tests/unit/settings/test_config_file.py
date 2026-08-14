"""Contains all tests for reading the settings from a configuration file."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
from pydantic import ValidationError
from yaml import YAMLError

from vdoc.config_file import config_file_path, log_configuration_source
from vdoc.constants import CONFIG_FILE_ENV_VAR, DEFAULT_CONFIG_FILE
from vdoc.models.plugins import FooterPlugin, OramaPlugin, ThemePlugin
from vdoc.models.project_category import ProjectCategory
from vdoc.settings import VDocSettings


@pytest.fixture(name="config_files")
def config_files_fixture(resource_dir: Path) -> Path:
    """Returns the directory holding the example configuration files.

    Args:
        resource_dir: The test resource directory.

    Returns:
        The path of the configuration file examples.
    """
    return resource_dir / "config-files"


def test_config_file_path_defaults() -> None:
    with patch.dict(os.environ, {}, clear=True):
        assert config_file_path() == DEFAULT_CONFIG_FILE


def test_config_file_path_from_environment(tmp_path: Path) -> None:
    with patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(tmp_path / "elsewhere.yaml")}, clear=True):
        assert config_file_path() == tmp_path / "elsewhere.yaml"


def test_settings_without_a_config_file() -> None:
    """The default location does not exist in a test run, which has to be silent, not fatal."""
    with patch.dict(os.environ, {}, clear=True):
        assert VDocSettings().docs_dir == Path("/srv/vdoc/docs/")


def test_settings_from_the_config_file(config_files: Path) -> None:
    with patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(config_files / "vdoc.yaml")}, clear=True):
        settings = VDocSettings()

    assert settings.docs_dir == Path("/from/the/file")
    assert settings.project_categories == [
        ProjectCategory(id=0, name="General"),
        ProjectCategory(id=1, name="Components"),
    ]
    assert settings.project_category_mapping == {"voraus-software-manual": "General"}
    assert settings.project_display_name_mapping == {"voraus-software-manual": "Software Manual"}


def test_environment_wins_over_the_config_file(config_files: Path) -> None:
    """Adding the file must not change what an existing deployment resolves to."""
    environment = {
        CONFIG_FILE_ENV_VAR: str(config_files / "vdoc.yaml"),
        "VDOC_DOCS_DIR": "/from/the/environment",
    }
    with patch.dict(os.environ, environment, clear=True):
        settings = VDocSettings()

    assert settings.docs_dir == Path("/from/the/environment")
    # Only the overridden setting comes from the environment, the rest still comes from the file
    assert settings.project_category_mapping == {"voraus-software-manual": "General"}


def test_plugins_read_their_own_section(config_files: Path) -> None:
    with patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(config_files / "vdoc.yaml")}, clear=True):
        footer = FooterPlugin()
        theme = ThemePlugin()
        orama = OramaPlugin()

    assert footer.active is True
    assert footer.copyright == "voraus robotik GmbH"
    assert footer.links[0].title == "Links"
    assert footer.links[0].links[0].title == "Homepage"

    assert str(theme.light.logo_url) == "https://example.com/light.png"

    # A plugin with no section in the file keeps its defaults
    assert orama.active is False
    assert orama.endpoint is None


def test_environment_wins_over_the_config_file_for_plugins(config_files: Path) -> None:
    environment = {
        CONFIG_FILE_ENV_VAR: str(config_files / "vdoc.yaml"),
        "VDOC_PLUGINS_FOOTER_COPYRIGHT": "Someone else",
    }
    with patch.dict(os.environ, environment, clear=True):
        assert FooterPlugin().copyright == "Someone else"


def test_a_malformed_config_file_fails_loudly(config_files: Path) -> None:
    """A typo in the file has to stop the app rather than silently resolve to defaults."""
    with (
        patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(config_files / "malformed.yaml")}, clear=True),
        pytest.raises(YAMLError),
    ):
        VDocSettings()


def test_an_unparsable_value_in_the_config_file_fails_validation(config_files: Path) -> None:
    with (
        patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(config_files / "invalid-value.yaml")}, clear=True),
        pytest.raises(ValidationError, match="Input should be a valid URL"),
    ):
        ThemePlugin()


def test_a_section_that_is_not_a_mapping_is_ignored(config_files: Path) -> None:
    """Whatever is in the file, a section vdoc cannot read must not take the settings down with it."""
    with patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(config_files / "not-mappings.yaml")}, clear=True):
        assert VDocSettings().docs_dir == Path("/srv/vdoc/docs/")
        assert FooterPlugin().active is False


def test_reading_the_config_file_is_logged(config_files: Path, caplog: pytest.LogCaptureFixture) -> None:
    path = config_files / "vdoc.yaml"
    with patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(path)}, clear=True), caplog.at_level("INFO"):
        log_configuration_source()

    assert f"Reading configuration from '{path}'. Environment variables override what it sets." in caplog.messages


def test_a_missing_config_file_is_logged(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    """A file that is not where vdoc looks for it must not be silent, it is too easy to mistype."""
    path = tmp_path / "not-mounted-here.yaml"
    with patch.dict(os.environ, {CONFIG_FILE_ENV_VAR: str(path)}, clear=True), caplog.at_level("INFO"):
        log_configuration_source()

    assert f"No configuration file at '{path}', reading the environment only" in caplog.messages
