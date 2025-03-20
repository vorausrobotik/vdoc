#!/usr/bin/env python3

"""Starts the vite and the uvicorn development servers in the background."""

import os
import subprocess
import time
from multiprocessing import Process

from uvicorn import run as uvicorn_run


def run_vite(port: int = 8090) -> None:
    """Starts the vite development server on the given port."""
    env = os.environ.copy()
    env["USE_VITE_PROXY"] = "1"

    subprocess.check_call(f"npm run dev -- --port {port}", shell=True, env=env)


def run_uvicorn(port: int = 8080) -> None:
    """Starts the uvicorn development server on the given port."""
    uvicorn_run(app="vdoc.api:app", host="localhost", port=port, reload=True, env_file=".env")


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
