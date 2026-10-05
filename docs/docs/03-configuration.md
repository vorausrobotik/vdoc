# Configuration

**vdoc** is configured from a YAML file, from environment variables, or from both. Internally it uses
[pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) for building the
configuration.

## Configuration file

The file is read from the path in `VDOC_CONFIG_FILE`, which defaults to `/srv/vdoc/vdoc.yaml`. It
is optional: if it is not there, nothing happens. **vdoc**'s own settings live under `vdoc` and each
plugin's under `plugins.<name>`:

```yaml
vdoc:
  docs_dir: /srv/vdoc/docs

plugins:
  site:
    title: Example Software Documentation
  footer:
    # A comment, which an environment variable can never carry
    copyright: Example Org
```

A file that is not valid YAML, or that holds a value a setting will not accept, stops the application
at startup rather than being ignored. A section that is present but is not a mapping is ignored. So
is a key vdoc has no setting for, with a warning in the log naming it: that is what lets two releases
share one file, such as a production and a preview deployment.

:::note

On a platform that offers no good way to write a file into the container, look for a file mount
feature — Dokploy, for instance, has one under _Advanced → Mounts_, which takes the content and a
path and keeps it across deployments. Be aware that per-pull-request preview deployments there get
their own directory, into which the file is not copied.

:::

## Environment variables

Every setting can equally be given as an environment variable, prefixed with `VDOC_`, and **an
environment variable takes precedence over the file**. That is what lets a single value be overridden
without editing anything, and it is where secrets belong — a file is likelier than a variable to end
up in version control.

The catch is that a variable left over from before the file existed silently shadows what the file
says. The path being read is logged at startup, and says as much:

```text
Reading configuration from '/srv/vdoc/vdoc.yaml'. Environment variables override what it sets.
```

A setting whose value is a list or a mapping has to be written as JSON in a variable, on a single
line, which is the reason the file is worth having. A setting that holds a structure of its own is
addressed with `__` between the levels, for example `VDOC_PLUGINS_THEME_LIGHT__LOGO_URL`.

## Settings

The environment variable for a setting is `VDOC_` followed by its name in upper case. Plugin
settings are documented on their own pages under [Plugins](04-plugins/index.mdx).

| Setting        | Explanation                                                                                                                                                    | Default                            | Example                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| `config_file`  | The path of the configuration file itself. Environment variable only, since it decides where the file is read from and so cannot come from it.                 | `/srv/vdoc/vdoc.yaml`              | `/etc/vdoc/vdoc.yaml`             |
| `docs_dir`     | The directory to which all project documentations will be uploaded.                                                                                            | `/srv/vdoc/docs/`                  | `/path/to/your/docs/`             |
| `database_url` | The database that records every project and version, and how each project is presented. It must not be inside `docs_dir`, because everything there is served.  | `sqlite:////srv/vdoc/data/vdoc.db` | `sqlite:////var/lib/vdoc/vdoc.db` |
| `api_username` | The username required for uploading documentations and for the [admin pages](#projects-and-categories). Neither works while both credentials are the defaults. | `admin`                            | `Something more secure`           |
| `api_password` | The password required for uploading documentations and for the admin page. Better kept in the environment than in the file.                                    | `admin`                            | `sup3r_s3cr3t`                    |
| `bind_address` | The application bind address.                                                                                                                                  | `0.0.0.0`                          | `127.0.0.1`                       |
| `bind_port`    | The application bind port.                                                                                                                                     | `8080`                             | `1337`                            |

## Projects and categories

The admin pages at `/admin` set how each project is presented, and keep it in the database. The menu
on the left switches between them. **Projects** lists every project, locked ones included. A click on
one opens it, where it is edited:

- the **display name**, shown instead of the project name
- a **description** in plain text, shown on the project's card on the landing page
- the **category** the landing page groups it under
- its **visibility**

The same page lists its versions, with a link to each, and uploads a new version from a ZIP archive
with **Upload version**. It also deletes a version or the whole project. Both deletions ask first,
and both delete the files as well.

| Visibility | On the landing page and in `llms.txt` and `sitemap.xml` | At its own address                                |
| ---------- | ------------------------------------------------------- | ------------------------------------------------- |
| Listed     | Yes                                                     | Readable                                          |
| Unlisted   | No                                                      | Readable, for anyone who has a link               |
| Locked     | No                                                      | Answers `404`, like a project that does not exist |

**Categories** creates, renames and deletes the categories, each shown in a color of its own. A
category can also be created right from a project's category field, by typing a name that does not
exist yet. Deleting a category moves its projects to _Misc_.

Opening an admin page leads to a login page first, which takes the API credentials. The login ends
with **Logout** in the user menu at the top right, after eight hours without use, or when vdoc
restarts. vdoc keeps the logins in memory, which is what makes logging out final, and why it runs as
a single process: a second one would not know them. Changing the credentials takes a restart, so it
ends every login too.

Uploads and the admin pages stay disabled while the credentials are still `admin`/`admin`, because
anyone could publish, hide or delete projects with credentials that are published here.

:::warning

vdoc does not limit how often a login may be tried. Rate-limit `/api/` at the reverse proxy in front
of vdoc, which has to terminate HTTPS anyway: the login cookie is only ever sent over HTTPS.

:::

:::note

The database lives in `/srv/vdoc/data/` by default. In a container, mount a volume there as well as
on `docs_dir`, or everything set on the admin page is lost with the container.

:::
