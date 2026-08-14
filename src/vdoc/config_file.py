"""Contains the configuration file settings source.

Every setting vdoc has can be given as an environment variable, which is all a container needs for
flat values. Structured ones fare worse: a list of footer link groups or a mapping of project
categories has to be squeezed into one variable as JSON, on a single line, with no room for a comment
explaining any of it.

So the same settings can also come from a YAML file, where they nest and can be annotated.

Environment variables take precedence over the file, which is what a deployment expects of them and
what lets a single value be overridden without editing anything.
"""

import logging
import os
from pathlib import Path
from typing import Any

from pydantic_settings import BaseSettings, YamlConfigSettingsSource

from vdoc.constants import CONFIG_FILE_ENV_VAR, DEFAULT_CONFIG_FILE

_logger = logging.getLogger(__name__)


def config_file_path() -> Path:
    """Returns the path of the configuration file.

    Read from the environment rather than from the settings, because it decides where the settings are
    read from and so cannot come from them.

    Returns:
        The configured path, or the default location.
    """
    return Path(os.environ.get(CONFIG_FILE_ENV_VAR, DEFAULT_CONFIG_FILE))


def log_configuration_source() -> None:
    """Reports where the configuration is read from.

    A file that is not where vdoc looks for it is otherwise indistinguishable from one that does not
    exist: the settings resolve to the environment and the defaults either way, and nothing says why.
    A mount path or a filename is easy to get wrong, so the path is logged whether or not it is there.
    """
    path = config_file_path()
    if path.is_file():
        _logger.info("Reading configuration from '%s'. Environment variables override what it sets.", path)
    else:
        _logger.info("No configuration file at '%s', reading the environment only", path)


class ConfigFileSettingsSource(YamlConfigSettingsSource):
    """Reads one mapping of the configuration file.

    ``YamlConfigSettingsSource`` hands a model the whole document, which would offer every model every
    other model's keys. This narrows it to the mapping the model owns, and returns nothing when that
    mapping -- or the file itself -- is absent, so an instance with no configuration file behaves
    exactly as it did before there was one.
    """

    def __init__(self, settings_cls: type[BaseSettings], section: tuple[str, ...] = ()) -> None:
        """Initializes the source.

        Args:
            settings_cls: The settings class being built.
            section: The path of the mapping to read, outermost key first. Empty reads the document.
        """
        self._section = section
        super().__init__(settings_cls, yaml_file=config_file_path())

    def __call__(self) -> dict[str, Any]:
        """Returns the settings found in the model's mapping.

        Returns:
            The mapping's contents, or an empty mapping if it is not there.
        """
        document: Any = super().__call__()
        for key in self._section:
            if not isinstance(document, dict):
                return {}
            document = document.get(key, {})

        return document if isinstance(document, dict) else {}
