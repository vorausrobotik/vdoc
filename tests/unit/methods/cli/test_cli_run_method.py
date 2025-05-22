"""Contains all tests for the CLI run method."""

from unittest.mock import MagicMock, patch

from pytest import LogCaptureFixture

from vdoc.methods.cli.cli_run_method import run_impl


@patch("vdoc.methods.cli.cli_run_method.uvicorn_run")
@patch("vdoc.methods.cli.cli_run_method.app")
def test_run_impl(app_mock: MagicMock, uvicorn_run_mock: MagicMock, caplog: LogCaptureFixture) -> None:
    with caplog.at_level("INFO"):
        run_impl("127.0.0.1", 4242)

    uvicorn_run_mock.assert_called_once_with(app=app_mock, host="127.0.0.1", port=4242)
    assert caplog.messages == [
        "Starting service on '127.0.0.1:4242'",
    ]
