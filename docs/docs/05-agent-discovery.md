# Agent and crawler discovery

A reader with a browser finds their way around **vdoc**'s interface. A client that does not run
JavaScript does not: a crawler, a link checker or an agent fetching a URL receives an almost empty HTML
shell from every readable address, and nothing in that shell points at the address that does carry the
page.

**vdoc** therefore states the situation in three files such a client already looks for, and in the shell
itself. All three are generated from what is actually published, so an upload is enough to appear in
them and none of them can drift out of date.

## What an automated client needs to know

Every page has two addresses. `/<project>/<version>/<page>` answers with **vdoc**'s application;
`/static/projects/<project>/<version>/<page>` is the page itself. [The frame contract](06-frame-contract.md)
explains why that split exists and how the two map onto each other. The consequence here is two lines:

- **Fetch the static address.** It is the only one that carries the page without a browser.
- **Pass on the readable one.** The two differ by nothing but the prefix, and a person following a link
  wants the page inside **vdoc**'s interface, with its navigation, version picker and search.

The second line is what keeps an agent's answer citable: a reader clicking a quoted link gets the page
in the site, not a bare file outside it.

## What a client reaching the readable address gets

A client handed a link by a person starts at the readable address, not at `robots.txt`. The shell it
receives there says where the page itself is, twice over:

- a `Link` header naming the static address of that same page, as
  `</static/projects/…>; rel="alternate"; type="text/html"`
- a `<noscript>` block stating the prefix rule and pointing at `/llms.txt`

The shell still has no content in it. Both exist so that a client holding the wrong address of the
right page can find the right one in the response it already has.

## `/llms.txt`

An index following the [llms.txt convention](https://llmstxt.org/): a markdown file at the site root
that tells an automated reader what a site holds and where to fetch it.

It contains, in this order:

- the site's name and one-sentence summary, from the [site plugin](04-plugins/02-site.md)
- how the two addresses relate, which one to fetch, which one to quote, and that `latest` stands in for
  a version
- a link to `/openapi.json`, for a client that would rather read JSON
- every project, grouped by its configured category, linked at the **newest published version** by its
  static address
- a `## Page indexes` section listing whatever machine-readable page index each version happens to ship

The page indexes are the part worth knowing about. Rather than crawling a version page by page, a client
can read the index the generator already wrote:

| File                | Written by | Contains                                               |
| ------------------- | ---------- | ------------------------------------------------------ |
| `objects.inv`       | Sphinx     | Every page and cross-reference target, zlib-compressed |
| `sitemap.xml`       | Docusaurus | Every page URL                                         |
| `search-index.json` | Docusaurus | The title and URL of every page, plus its text         |

**vdoc** advertises the ones a published version actually contains, so a project is described by what it
has rather than by which generator built it. Sphinx's `searchindex.js` is deliberately left out: it
says nothing `objects.inv` does not already say, and listing both doubled the section for no gain.

## `/robots.txt`

A [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html) file. Nothing is
disallowed — every published page is meant to be read — and its real purpose here is to point at the
other two files, which no crawler would otherwise know to look for: `/llms.txt` in a comment, and
`/sitemap.xml` in the `Sitemap` field crawlers actually parse.

## `/sitemap.xml`

A [sitemap](https://www.sitemaps.org/protocol.html) with one entry per project: the **static** address
of its newest version's `index.html`, dated by the day that version was published.

That is one entry point, not one entry per page. From a version's index the crawler follows the
documentation's own links, which are relative and stay inside that version. A project whose newest
version has no `index.html` is left out, so that every `<loc>` in the file answers `200`.

Superseded versions are not listed — a search engine counts them as duplicated content. A client that
wants them all asks `/api/projects/<project>/versions`, which `llms.txt` points at through
`/openapi.json`.

:::note[Two different files called `sitemap.xml`]

A Docusaurus project ships a `sitemap.xml` of its own inside each published version, and **vdoc** lists
those under `## Page indexes` in `llms.txt`. That file covers the pages of one version of one project.
This one covers the whole instance. They are unrelated, and the per-version file is the more useful of
the two if what you want is every page of a project.

:::

## Configuring what they say

None of the three files has settings of its own. The name and the summary come from the
[site plugin](04-plugins/02-site.md), the grouping from `project_categories` and
`project_category_mapping` in the [configuration](03-configuration.md#configuration-file), and
everything else from the documentation directory.

```yaml
plugins:
  site:
    title: Example Software Documentation
    description: Documentation for the Example automation platform.
```

That title becomes the heading of `llms.txt`, and the description its summary. Without them the file
still renders, under a generic heading.

## Absolute URLs and reverse proxies

All three files list absolute URLs, so that they keep working once copied away from the site they came
from. The host is taken from the request, honoring `X-Forwarded-Proto` and `X-Forwarded-Host` so that a
**vdoc** behind a reverse proxy names the address readers actually use rather than its own container.

The `Link` header names a path rather than a URL, which a client resolves against the address it just
requested.

## Trying it

```sh
curl https://your-vdoc.example.com/llms.txt
curl https://your-vdoc.example.com/robots.txt
curl https://your-vdoc.example.com/sitemap.xml
curl -sI https://your-vdoc.example.com/my-project/latest/index.html | grep -i '^link:'
```

A useful check, if something looks wrong: every link in `llms.txt` and every `<loc>` in `sitemap.xml`
should answer `200`. A readable address that answers `404` means the version is gone; a static address
that does means the file is.
