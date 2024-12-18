"""Contains all unit tests for the main CLI."""

from unittest.mock import MagicMock, patch

from typer.testing import CliRunner

from vdoc.cli.main import app


@patch("vdoc.cli.main.get_app_version")
def test_main_cli_prints_version(get_app_version_mock: MagicMock, cli_runner: CliRunner) -> None:
    get_app_version_mock.return_value = 42
    result = cli_runner.invoke(app, ["--version"])
    assert "42\n" == result.stdout
