#!/usr/bin/env python3

"""Starts the vite and the uvicorn development servers in the background."""

import os
import subprocess
import sys
import time
from multiprocessing import Process


def run_vite(port: int = 8090) -> None:
    """Starts the vite development server on the given port."""
    env = os.environ.copy()
    env["USE_VITE_PROXY"] = "1"

    subprocess.check_call(f"npm run dev -- --port {port}", shell=True, env=env)  # noqa: S602


def run_uvicorn(port: int = 8080) -> None:
    """Starts the uvicorn development server on the given port.

    Started as a subprocess rather than through ``uvicorn.run``: the reloader spawns the actual server as a further
    subprocess and hands it the stdin file descriptor of its own process. Inside a ``multiprocessing`` child that
    descriptor is a ``/dev/null`` replacement which the spawned process does not have, so the server died on startup
    with ``OSError: [Errno 9] Bad file descriptor`` while the reloader kept running without it.
    """
    subprocess.check_call(  # noqa: S603
        [
            sys.executable,
            "-m",
            "uvicorn",
            "vdoc.api:create_app",
            "--factory",
            "--reload",
            # Without this the reloader watches the whole repository, `.venv` and both `node_modules`
            # trees included, which is tens of thousands of files it has no reason to look at.
            "--reload-dir",
            "src/vdoc",
            "--host",
            "localhost",
            "--port",
            str(port),
            "--env-file",
            ".env",
        ]
    )


def main() -> None:
    """Starts the vite and the uvicorn development servers in the background.

    Note that the uvicorn port (defaults to 8080) must match the configured /api proxy port in the `vite.config.ts`
    file.
    """
    processes = [
        Process(target=run_uvicorn),
        Process(target=run_vite),
    ]

    for proc in processes:
        proc.start()

    while True:
        try:
            time.sleep(0.5)
        except KeyboardInterrupt:
            break

    for proc in processes:
        proc.join()


if __name__ == "__main__":
    main()
