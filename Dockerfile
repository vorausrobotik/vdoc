# One image, two ways to build it:
# - `source` builds everything from a git checkout. Dokploy builds it with
#   "Docker Build Stage" set to `source`, and so does `docker build --target source .`.
# - `wheel` installs the wheel CI built into `dist/`, so the image ships exactly the
#   published package. It is the last stage and so the default, because
#   `vpu docker build` cannot pass `--target` before voraus-pipeline-utils 1.0.

FROM python:3.14-alpine@sha256:f6a589d43c42b9e7f7dc67a12d37132491f362859a5d750607710cc56da3bc72 AS python

# --- Build the web UI ---------------------------------------------------------
FROM node:lts-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS ui-build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src/ui/ src/ui/
# The tsc type-check of `npm run build` is skipped. CI gates types.
RUN npx vite build

# --- Build the python wheel ---------------------------------------------------
FROM python AS py-build
WORKDIR /build

# Restore the tracked working tree from the git metadata instead of copying
# individual files: setuptools_scm needs .git to derive the version and would
# flag any difference between working tree and HEAD as dirty.
RUN apk add --no-cache git
COPY .git/ .git/
# Dokploy clones with a hardcoded --depth 1, which strips the history and tags
# setuptools_scm needs. Re-fetch them from the public repository (also avoids
# relying on any credentials embedded in the cloned remote URL).
RUN git remote set-url origin https://github.com/vorausrobotik/vdoc.git \
    && (git fetch --quiet --unshallow --tags origin || git fetch --quiet --tags origin) \
    && git checkout -- .

COPY --from=ui-build /build/src/vdoc/webapp/ src/vdoc/webapp/
RUN pip wheel --no-deps --no-cache-dir --wheel-dir /dist .

# --- Runtime ------------------------------------------------------------------
FROM python AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
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
RUN --mount=type=bind,from=py-build,source=/dist,target=/pip-packages/ \
    pip install --no-cache-dir --no-compile /pip-packages/*.whl

FROM runtime AS wheel
RUN --mount=type=bind,source=./dist/,target=/pip-packages/ \
    pip install --no-cache-dir --no-compile /pip-packages/*.whl
