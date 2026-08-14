# Development

vdoc is a Python backend and a React frontend in one repository, plus this documentation site.
`tox` drives everything on the Python side, `npm` everything on the JavaScript side.

## Layout

| Path                           | What lives there                                            |
| ------------------------------ | ----------------------------------------------------------- |
| `src/vdoc/`                    | The FastAPI application and the `vdoc` CLI                  |
| `src/ui/`                      | The frontend: Vite, React, MUI, TanStack Router and Query   |
| `docs/`                        | This site: a Docusaurus project with its own `package.json` |
| `tests/unit/`                  | pytest, one module per module under test                    |
| `tests/integration/`           | pytest against a running application                        |
| `tests/ui/`                    | Playwright, driving the frontend in a browser               |
| `tests/resources/sample-docs/` | Real Sphinx projects the tests build and upload             |

The frontend builds into `src/vdoc/webapp/`, which is why that directory is git-ignored and shipped
inside the wheel — a `pip install vdoc` carries the interface with it.

## Setting up

```shell
uv sync
npm ci
```

Then a `.env` for local overrides. It is read by the development server and by the Playwright
tests, and everything in it beats the configuration file:

```shell
VDOC_CONFIG_FILE=vdoc.yaml
VDOC_DOCS_DIR=/path/to/some/documentation
```

## Running it

```shell
./start_dev.py
```

That starts uvicorn on `8080` with reload and Vite on `8090`, with `/api` and `/static` proxied
from Vite to uvicorn — so the frontend on
[localhost:8090](http://localhost:8090) talks to the backend you are editing, and both reload on
save.

## Tasks

```shell
tox run -e lint             # codespell, mypy, ruff
tox run -e py311-test       # pytest, with coverage
tox run -e docs             # license page, then build this site
tox run -e build            # the wheel, depends on the UI and docs builds

npm run lint                # biome, and prettier over markdown and YAML
npm run format              # the same, writing
npm run test:unit           # vitest
npm run test:e2e            # playwright, starts its own dev server on 3000
```

`tox run` with no environment runs lint and the test matrix across every supported Python version.

## Working on the documentation

The site is built with [`@voraus/docusaurus-theme`](https://www.npmjs.com/package/@voraus/docusaurus-theme),
which carries the voraus look and most of the configuration, so
[docusaurus.config.ts](https://github.com/vorausrobotik/vdoc/blob/main/docs/docusaurus.config.ts)
stays short. For writing, the development server beats a full build:

```shell
npm --prefix docs ci
npm --prefix docs start
```

Pages live in `docs/docs/`. The sidebar is generated from that directory, so a new page needs no
registration: the number prefix on a file name orders it and is stripped from the URL, and a
directory becomes a category with its `index.mdx` as the category page.

A few things fail the build rather than shipping broken: an internal link that points nowhere, a
missing image, and invalid MDX. Link between pages by file path, for example
`[Configuration](03-configuration.md)`, so that a renamed page is caught rather than silently
404ing.

`.md` is parsed as CommonMark and `.mdx` as MDX. That is what keeps the generated license page —
which contains whatever third-party metadata says, including things that look like HTML tags — from
being able to break the build.

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please): the
commit messages on `main` decide the next version, and merging the release pull request tags it.
The pipeline then builds the wheel, the Docker image and this site, publishes them, and deploys
[docs.vorausrobotik.com](https://docs.vorausrobotik.com/).

So commit messages matter — [Conventional Commits](https://www.conventionalcommits.org/), with
`feat:` and `fix:` being what moves the version.
