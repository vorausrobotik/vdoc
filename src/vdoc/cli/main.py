"""Contains the main CLI entry point."""

import logging
from enum import Enum

import typer
from rich.logging import RichHandler

from vdoc import get_app_name, get_app_version
from vdoc.cli.run import _cli_run

_logger = logging.getLogger(__name__)


app = typer.Typer()
app.command(name="run", help="Runs the application")(_cli_run)


class LogLevel(str, Enum):
    """Enum for log levels for typer."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"

    def __str__(self) -> str:
        """String representation of the log level.

        Returns:
            The log level as string.
        """
        return self.value


def print_version(do_print: bool) -> None:
    """Prints the version of the software.

    Args:
        do_print: If the version shall be printed.

    Raises:
        typer.Exit: After the version was printed.
    """
    if do_print:
        print(get_app_version())
        raise typer.Exit()


@app.callback()
def _common(
    _: bool = typer.Option(
        False,
        "--version",
        callback=print_version,
        is_eager=True,
        help="Print the installed version of the software.",
    ),
    log_level: LogLevel = typer.Option(LogLevel.INFO, help="The log level"),
) -> None:
    logging.basicConfig(level=log_level.value, format="%(message)s", handlers=[RichHandler()])
    _logger.info(f"Starting {get_app_name()}@{get_app_version()}")


typer_click_object = typer.main.get_command(app)

if __name__ == "__main__":  # pragma: no cover
    app()
