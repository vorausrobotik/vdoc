# One image, two ways to build it:
# - `source` builds vdoc from the checkout. Dokploy builds it with "Docker Build Stage"
#   set to `source`, and so does `docker build --target source .`.
# - `wheel` installs the wheel CI built into `dist/`, so the image ships exactly the
#   published package. It is the last stage and so the default, because
#   `vpu docker build` cannot pass `--target` before voraus-pipeline-utils 1.0.
# Both install the dependencies at the versions pinned in `uv.lock`.

FROM python:3.14-alpine@sha256:f6a589d43c42b9e7f7dc67a12d37132491f362859a5d750607710cc56da3bc72 AS python
FROM ghcr.io/astral-sh/uv:0.12.23@sha256:61d393e44e249f2e4b526b6c7ddcecce245946826e608e11c93ad4f5bba55b21 AS uv

# --- Build the web UI ---------------------------------------------------------
FROM node:lts-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS ui-build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src/ui/ src/ui/
# The tsc type-check of `npm run build` is skipped. CI gates types.
RUN npx vite build

# --- Install the dependencies -------------------------------------------------
FROM python AS dependencies
COPY --from=uv /uv /bin/

# `UV_LINK_MODE=copy`, because the cache mount is on another filesystem than the venv.
# `UV_PYTHON_DOWNLOADS=0` keeps uv on the base image's Python, which the runtime shares.
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0
WORKDIR /app

# `--no-default-groups`, because `tool.uv.default-groups` would add the `tox` group.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-default-groups --no-install-project

# --- Install vdoc -------------------------------------------------------------
FROM dependencies AS source-venv
COPY pyproject.toml uv.lock README.md LICENSE.txt ./
COPY src/vdoc/ src/vdoc/
COPY --from=ui-build /build/src/vdoc/webapp/ src/vdoc/webapp/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-default-groups --no-editable

FROM dependencies AS wheel-venv
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=dist,target=/dist \
    uv pip install --no-deps /dist/*.whl

# --- Runtime ------------------------------------------------------------------
FROM python AS runtime

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1
# Trust the forwarded headers of a reverse proxy on loopback or on any private network, where Docker puts it.
# Without this, uvicorn trusts only 127.0.0.1 and builds redirects with `http://` behind an HTTPS proxy.
ENV FORWARDED_ALLOW_IPS=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8,fc00::/7,::1

EXPOSE 8080
# A preview deployment mounts the production data and docs under /srv/vdoc/seed
# instead of on the default directories. Each container start copies them into
# its own filesystem, so a preview's migrations and uploads never reach
# production or another preview, and the copy is gone with the container.
# Production mounts no seed directory and starts unchanged.
ENTRYPOINT [ "/bin/sh", "-c", "set -e; for dir in data docs; do if [ -d \"/srv/vdoc/seed/$dir\" ]; then cp -a \"/srv/vdoc/seed/$dir/.\" \"/srv/vdoc/$dir/\"; fi; done; exec vdoc \"$@\"", "vdoc" ]
CMD ["run"]

# Default projects and database directories (mount a volume on each,
# or the production ones under /srv/vdoc/seed for a preview, see ENTRYPOINT)
RUN mkdir -p /srv/vdoc/docs /srv/vdoc/data

# --- Targets ------------------------------------------------------------------
FROM runtime AS source
COPY --from=source-venv /app/.venv /app/.venv

FROM runtime AS wheel
COPY --from=wheel-venv /app/.venv /app/.venv
