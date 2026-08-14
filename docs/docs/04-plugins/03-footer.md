# Footer plugin

**vdoc** can be extended with a footer plugin, which renders a copyright line and groups of links
below the documentation.

## Configuration

Under `plugins.footer` in the [configuration file](../03-configuration.md#configuration-file):

```yaml
plugins:
  footer:
    copyright: Example Org
    links:
      - title: Contact
        links:
          - title: Email
            icon: email
            href: mailto:service@example.com
      - title: Links
        links:
          - title: Homepage
            icon: home
            href: https://example.com
```

Every setting can equally be given as an environment variable, which then takes precedence over the
file. A structured setting has to be written as JSON there, on one line, which is the reason the file
exists:

```sh
VDOC_PLUGINS_FOOTER_COPYRIGHT='Example Org'
VDOC_PLUGINS_FOOTER_LINKS='[{"title": "Contact", "links": [{"title": "Email", "icon": "email", "href": "mailto:service@example.com"}]}]'
```

## Settings

| Setting     | Explanation                                                                                                                                           | Default | Example       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------- |
| `copyright` | The copyright holder without copyright mark or year.                                                                                                  | `None`  | `Example Org` |
| `links`     | A list of link groups to display in the footer. Each group has a `title` and a list of `links`, each of which has a `title`, an `icon` and an `href`. | `[]`    | see above     |

The environment variable for a setting is `VDOC_PLUGINS_FOOTER_` followed by its name in upper case.

The plugin is active as soon as a copyright holder or at least one link group is configured.
