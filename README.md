# vdoc

<div class="badges">

[![Pipeline](https://github.com/vorausrobotik/vdoc/actions/workflows/pipeline.yml/badge.svg)](https://github.com/vorausrobotik/vdoc/actions/workflows/pipeline.yml)
[![Coverage](https://codecov.io/gh/vorausrobotik/vdoc/graph/badge.svg)](https://codecov.io/gh/vorausrobotik/vdoc)
[![PyVersions](https://img.shields.io/pypi/pyversions/vdoc)](https://pypi.org/project/vdoc)
[![PyPI](https://img.shields.io/pypi/v/vdoc)](https://pypi.org/project/vdoc)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![uv](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json)](https://github.com/astral-sh/uv)
[![Checked with mypy](https://www.mypy-lang.org/static/mypy_badge.svg)](https://mypy-lang.org/)

</div>

Multi version documentation hosting.

## See it in action

The vdoc instance serving the [voraus robotik GmbH](https://www.vorausrobotik.com/) software documentation is available
at [docs.vorausrobotik.com](https://docs.vorausrobotik.com/).

## AI and agent ready

Documentation is read by crawlers, link checkers and coding agents as much as by people, and a
JavaScript application tells them nothing. vdoc therefore publishes what it holds in three files such a
client already looks for, all generated from what is actually published:

|                                                              |                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`/llms.txt`](https://docs.vorausrobotik.com/llms.txt)       | Every project at its newest version, linked at the address that serves real HTML, plus the machine-readable page index each version ships |
| [`/sitemap.xml`](https://docs.vorausrobotik.com/sitemap.xml) | The same entry points as a sitemap, dated by when each version was published                                                              |
| [`/robots.txt`](https://docs.vorausrobotik.com/robots.txt)   | Allows everything, and points at both of the above                                                                                        |

`llms.txt` follows the [llms.txt convention](https://llmstxt.org/), `sitemap.xml` the
[sitemaps protocol](https://www.sitemaps.org/protocol.html), and `robots.txt` the
[Robots Exclusion Protocol (RFC 9309)](https://www.rfc-editor.org/rfc/rfc9309.html).

A page requested at its readable address answers with a `Link` header naming the static address that
carries it, so a client that started from a link a person shared finds the content from the response
it already has. And an agent is told which of the two addresses to quote back: the readable one.

See [Agent and crawler discovery](https://vorausrobotik.github.io/vdoc/agent-discovery) for how it
works and what it contains.

## Documentation

Please read the [documentation](https://vorausrobotik.github.io/vdoc/) for more a more detailed introduction.
