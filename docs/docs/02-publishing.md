# Publishing documentation

Documentation gets into vdoc through one endpoint. There is nothing to install on vdoc's side and
no plugin to write for a generator: anything that produces a directory with an `index.html` in it
can publish.

## The upload

```text
POST /api/projects/<project>/versions/<version>
```

HTTP Basic authentication, and the archive as a multipart field named `file`:

```shell
curl --user "$API_USER:$API_PASSWORD" \
  --form "file=@docs.zip;type=application/zip" \
  https://docs.example.com/api/projects/example/versions/1.0.0
```

A successful upload answers `201` and the version is live immediately.

## What is accepted

| Rule                                                                                                       | Otherwise |
| ---------------------------------------------------------------------------------------------------------- | --------- |
| The project name holds only letters, digits, `-` and `_`                                                   | `400`     |
| The version is a valid [PEP 440](https://peps.python.org/pep-0440/) version, such as `1.0.0` or `2.1.0rc1` | `400`     |
| The upload is a ZIP archive, sent with content type `application/zip`                                      | `400`     |
| The archive has an `index.html` at its root                                                                | `400`     |
| The version does not exist yet                                                                             | `403`     |

An upload that fails leaves nothing behind: a half-extracted archive is removed again.

The project directory does not have to be created first — the first upload for a name creates it.
Everything else about a project, its display name and its category, is configured on the vdoc side
and never travels with the upload. See [Configuration](03-configuration.md).

## Versions are immutable

A version that exists is never overwritten, which is why re-running a release pipeline answers
`403` rather than quietly replacing what readers already have. There is no delete endpoint either;
removing a version means removing its directory under `docs_dir` on the server.

`latest` resolves to the **highest** version, not the most recently uploaded one — publishing a fix
for an older release does not move it.

## In a pipeline

```shell
zip -r docs.zip . && curl --fail --user "$API_USER:$API_TOKEN" \
  --form "file=@docs.zip;type=application/zip" \
  "$VDOC_URL/api/projects/$PROJECT/versions/$VERSION"
```

Inside voraus, `voraus-pipeline-utils` wraps exactly this:

```shell
vpu docs upload docs/build --project-name example --project-version 1.0.0
```

It reads `API_URL`, `API_USER` and `API_TOKEN` from the environment and defaults to
`https://docs.vorausrobotik.com/api`.

## Reading what is published

```text
GET /api/projects/                      # every project
GET /api/projects/<project>/versions/   # its versions, oldest first
```

The full API is documented at `/apidoc` on any running instance, and `/llms.txt` lists every project
at its newest version for clients that do not want to call an API at all — see
[Agent and crawler discovery](05-agent-discovery.md).
