# Site plugin

**vdoc** can be extended with a site plugin, which says what a given instance of vdoc is. vdoc itself
cannot know: it is a generic documentation host, and the same build serves whoever deploys it.

The values are used for two audiences at once. The landing page introduces itself with them above the
projects it serves, and `llms.txt` uses them as its heading and its summary, so that a reader and an
automated client are told the same thing about where they have arrived.

The plugin is active as soon as any of the title, the description or the long description is set.

## Configuration

Under `plugins.site` in the [configuration file](../03-configuration.md#configuration-file):

```yaml
plugins:
  site:
    title: Example Software Documentation
    description: Documentation for the Example automation platform.
    long_description:
      - Develop, simulate and run everything on standard industrial PCs.
      - ''
      - '- **example.core** -- the real-time runtime'
      - '- **example.pioneer** -- development and simulation'
```

Every setting can equally be given as an environment variable, which then takes precedence over the
file:

```sh
VDOC_PLUGINS_SITE_TITLE='Example Software Documentation'
VDOC_PLUGINS_SITE_LONG_DESCRIPTION='["A paragraph.", "", "- first item", "- second item"]'
```

The long description is a **list of lines** either way. Markdown is line based, and a single string
carrying line breaks survives a YAML file but not an environment variable, where a deployment
platform's web form tends to flatten them. An empty element is a blank line, which is how markdown
starts a new paragraph. A value that is not a list fails at startup rather than reaching the landing
page.

## Settings

| Setting                | Explanation                                                                                                                                                        | Default | Example                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------- |
| `title`                | The name of this documentation site. A short noun phrase rather than a sentence: it is a heading, and the description below explains.                              | `None`  | `Example Software Documentation`                     |
| `description`          | One sentence on what this site holds. Worth naming the products it documents, since this is what a search over `llms.txt` matches against.                         | `None`  | `Documentation for the Example automation platform.` |
| `long_description`     | Markdown, as a list of lines, for whatever needs more room than one sentence. Rendered below the description.                                                      | `None`  | `["- **example.core** -- the real-time runtime"]`    |
| `show_on_landing_page` | Whether the landing page introduces itself with the title and the description. `llms.txt` always uses them, because a client reading it has nothing else to go on. | `True`  | `False`                                              |

The environment variable for a setting is `VDOC_PLUGINS_SITE_` followed by its name in upper case.

## Rendering

Only `p`, `a`, `strong`, `em`, `code`, `ul`, `ol`, `li` and `br` are rendered from
the long description — the banner owns its own type hierarchy, so a heading or an image would fight
it — and anything else degrades to its text rather than disappearing. Raw HTML is never rendered.
