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

A new version of a project that exists already can also be uploaded by hand, with **Upload version**
on the project's [admin page](03-configuration.md#projects-and-categories). The same rules apply.

## What is accepted

| Rule                                                                                                       | Otherwise |
| ---------------------------------------------------------------------------------------------------------- | --------- |
| The project name holds only letters, digits, `-` and `_`, and is not `admin`, `api`, `apidoc` or `static`  | `400`     |
| The version is a valid [PEP 440](https://peps.python.org/pep-0440/) version, such as `1.0.0` or `2.1.0rc1` | `400`     |
| The upload is a ZIP archive, sent with content type `application/zip`                                      | `400`     |
| The archive has an `index.html` at its root                                                                | `400`     |
| The version does not exist yet                                                                             | `403`     |
| The credentials are not the defaults `admin`/`admin`                                                       | `403`     |

An upload that fails leaves nothing behind: a half-extracted archive is removed again.

The project does not have to be created first. The first upload for a name creates it, listed and
without a category. Everything else about a project is set on the admin page and never travels with
the upload. See [Projects and categories](03-configuration.md#projects-and-categories).

## Versions are immutable

A version that exists is never overwritten, which is why re-running a release pipeline answers
`403` rather than quietly replacing what readers already have.

A version is deleted on its project's admin page, or with the API:

```text
DELETE /api/projects/<project>/versions/<version>
DELETE /api/projects/<project>
```

Both delete the files as well. Deleting the last version of a project deletes the project. To take a
project offline without deleting anything, lock it instead.

A version directory that is copied into `docs_dir` by hand is picked up the next time vdoc starts.

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
GET /api/projects/                      # every listed project
GET /api/projects/<project>/versions/   # its versions, oldest first
```

The full API is documented at `/apidoc` on any running instance, and `/llms.txt` lists every project
at its newest version for clients that do not want to call an API at all — see
[Agent and crawler discovery](05-agent-discovery.md).
