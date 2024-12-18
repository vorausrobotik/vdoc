"""Contains all unit tests for the run CLI."""

from unittest.mock import MagicMock, patch

from typer.testing import CliRunner

from vdoc.cli.main import app


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
