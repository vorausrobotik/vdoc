---
slug: /
title: Introduction
# Every other page is ordered by the number its file name starts with. This one carries no
# prefix, because its file name is what makes it the site's landing page, so it says where it
# belongs instead - without this it sorts after the numbers rather than ahead of them.
sidebar_position: 0
---

# vdoc

vdoc hosts documentation for many projects, at many versions, in one place. A project builds its
documentation, uploads the result as a ZIP, and vdoc serves it at `/<project>/<version>/` with a
landing page, a version picker and its own header around it.

It builds nothing itself and does not care what did. Sphinx, Docusaurus, Doxygen and a hand-written
`index.html` all publish the same way: a directory of files with an `index.html` in it.

:::info[🌍 See it in action]

The [voraus robotik GmbH](https://www.vorausrobotik.com/) software documentation runs on vdoc:
**[docs.vorausrobotik.com](https://docs.vorausrobotik.com/)**

:::

## What it does

- **Keeps every version.** An upload never overwrites an earlier one, and `latest` follows the
  newest. → [Publishing documentation](02-publishing.md)
- **Looks like your organization.** Title, logo, colors, footer links and search are configuration,
  not a fork. → [Plugins](04-plugins/index.mdx)
- **Answers machines as well as people.** `/llms.txt` and `/robots.txt` are generated from what is
  actually published. → [Agent and crawler discovery](05-agent-discovery.md)
- **Stays consistent across generators.** vdoc renders the chrome, the framed site hides its own.
  → [The frame contract](06-frame-contract.md)

## Where to start

[Getting started](01-getting-started.mdx) has vdoc running and a first version published in a few
minutes. From there, [Configuration](03-configuration.md) is the reference for everything an
instance can be told.

If you are building a documentation site that vdoc will serve,
[`@voraus/docusaurus-theme`](https://vorausrobotik.github.io/voraus-docusaurus-theme/) implements
[the frame contract](06-frame-contract.md) already.
