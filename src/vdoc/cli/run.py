"""This module defines the typer run method."""

import logging
from typing import Annotated

import typer

from vdoc.methods.cli.cli_run_method import run_impl
from vdoc.settings import VDocSettings

_logger = logging.getLogger(__name__)


def _cli_run(
    bind_address: Annotated[
        str,
        typer.Option(help="Application bind ip address."),
    ] = VDocSettings().bind_address,
    bind_port: Annotated[
        int,
        typer.Option(help="Application bind port."),
    ] = VDocSettings().bind_port,
) -> None:  # noqa: disable=D103
    try:
        run_impl(bind_address=bind_address, bind_port=bind_port)
    except KeyboardInterrupt as error:
        raise typer.Exit(0) from error
    except Exception as error:
        _logger.error(error)
        raise typer.Exit(1) from error
