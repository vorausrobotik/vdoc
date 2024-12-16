"""Contains all CLI methods for running the application."""

import logging

from uvicorn import run as uvicorn_run

from vdoc.api import app

_logger = logging.getLogger(__name__)


def run_impl(bind_address: str, bind_port: int) -> None:
    """Starts the FastAPI app with the given parameters.

    Args:
        bind_address: The bind address of the application.
        bind_port: The bind port of the application.
    """
    _logger.info(f"Starting service on '{bind_address}:{bind_port}'")
    uvicorn_run(app=app, host=bind_address, port=bind_port)
