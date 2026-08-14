# Orama plugin

**vdoc** can be extended with an Orama plugin, which puts a search box in the header that searches
across everything the instance serves — rather than one version at a time, which is all a framed
documentation site can offer.

The index itself lives in [Orama Cloud](https://orama.com/); vdoc only renders the search box
against it. The plugin is active as soon as both an endpoint and an API key are configured, and
until then the header shows no search at all.

## Configuration

Under `plugins.orama` in the [configuration file](../03-configuration.md#configuration-file):

```yaml
plugins:
  orama:
    endpoint: https://cloud.orama.run/v1/indexes/example-abc123
    api_key: your-public-api-key
    disable_chat: false
```

The API key is the **public** search key of the index, which is meant to reach the browser. The
private one that writes to the index has no business here.

```sh
VDOC_PLUGINS_ORAMA_ENDPOINT='https://cloud.orama.run/v1/indexes/example-abc123'
VDOC_PLUGINS_ORAMA_API_KEY='your-public-api-key'
```

## Settings

| Setting          | Explanation                                                | Default |
| ---------------- | ---------------------------------------------------------- | ------- |
| `endpoint`       | The URL of the Orama Cloud index to search.                | `None`  |
| `api_key`        | The public API key of that index.                          | `None`  |
| `disable_chat`   | Whether to drop Orama's answer chat and keep plain search. | `False` |
| `facet_property` | The indexed property to group results by.                  | `None`  |
| `dictionary`     | Overrides for the wording in the search box.               | `None`  |

The environment variable for a setting is `VDOC_PLUGINS_ORAMA_` followed by its name in upper case.
The dictionary sits one level deeper, so it is addressed with `__`:

```sh
VDOC_PLUGINS_ORAMA_DICTIONARY__SEARCH_PLACEHOLDER='Search the documentation'
```

`OramaDictionary` in `src/vdoc/models/plugins/orama.py` accepts every label Orama's own dictionary
defines, but the frontend currently forwards only four of them: `search_placeholder`,
`chat_placeholder`, `disclaimer` and `suggestions`. The rest are accepted and ignored — passing one
through is a line in `OramaSearchPlugin.tsx`.
