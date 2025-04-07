"""Contains all unit tests for the run CLI."""

import os
from unittest.mock import MagicMock, patch

from typer.testing import CliRunner

from vdoc.cli.main import app


@patch("vdoc.cli.run.run_impl")
def test_cli_warns_about_default_credentials(_: MagicMock, cli_runner: CliRunner) -> None:
    result = cli_runner.invoke(app=app, args=["run"])
    assert 0 == result.exit_code
    assert "The application is running using the default credentials" in result.stdout


@patch.dict(os.environ, {"VDOC_API_PASSWORD": "updated"}, clear=True)
@patch("vdoc.cli.run.run_impl")
def test_cli_doesnt_warn_about_updated_credentials(_: MagicMock, cli_runner: CliRunner) -> None:
    result = cli_runner.invoke(app=app, args=["run"])
    assert 0 == result.exit_code
    assert "The application is running using the default credentials" not in result.stdout


@patch("vdoc.cli.run.run_impl")
def test_run_success(run_impl_mock: MagicMock, cli_runner: CliRunner) -> None:
    result = cli_runner.invoke(app=app, args=["run"])
    assert 0 == result.exit_code
    run_impl_mock.assert_called_once()


@patch("vdoc.cli.run.run_impl")
def test_run_keyboard_interrupt(run_impl_mock: MagicMock, cli_runner: CliRunner) -> None:
    run_impl_mock.side_effect = KeyboardInterrupt()
    result = cli_runner.invoke(app=app, args=["run"])
    assert 0 == result.exit_code
    run_impl_mock.assert_called_once()


@patch("vdoc.cli.run.run_impl")
def test_run_keyboard_error(run_impl_mock: MagicMock, cli_runner: CliRunner) -> None:
    run_impl_mock.side_effect = ValueError("Something is wrong")
    result = cli_runner.invoke(app=app, args=["run"])
    assert 1 == result.exit_code
    run_impl_mock.assert_called_once()
    assert "Something is wrong" in result.stdout
