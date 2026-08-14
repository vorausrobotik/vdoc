Configuration
#############

**vdoc** can be configured via environment variables. Internally, it uses
`pydantic-settings <https://docs.pydantic.dev/latest/concepts/pydantic_settings/>`_ for building the configuration.
All configuration environment variables are prefixed with ``VDOC_``:


.. list-table:: VDoc Configuration
   :widths: 25 25 25 25
   :header-rows: 1

   * - Environment variable
     - Explanation
     - Default
     - Example
   * - ``VDOC_CONFIG_FILE``
     - The path of the optional configuration file. See :ref:`configuration-file` below.
     - ``/srv/vdoc/vdoc.yaml``
     - ``/etc/vdoc/vdoc.yaml``
   * - ``VDOC_DOCS_DIR``
     - The directory to which all project documentations will be uploaded.
     - ``/srv/vdoc/docs/``
     - ``/path/to/your/docs/```
   * - ``VDOC_API_USERNAME``
     - The username required for uploading documentations via the API.
     - ``admin``
     - ``Something more secure``
   * - ``VDOC_API_PASSWORD``
     - The password required for uploading documentations via the API.
     - ``admin``
     - ``sup3r_s3cr3t``
   * - ``VDOC_BIND_ADDRESS``
     - The application bind address.
     - ``0.0.0.0``
     - ``127.0.0.1``
   * - ``VDOC_BIND_PORT``
     - The application bind port.
     - ``8080``
     - ``1337``
   * - ``VDOC_PROJECT_DISPLAY_NAME_MAPPING``
     - An optional mapping (dictionary) of project names to display names.
     - ``{}``
     - ``{"project-01": "Project Name", "project-02": "Another Project Name"}``
   * - ``VDOC_PROJECT_CATEGORIES``
     - An optional list of project categories.
     - ``[]``
     - ``[{"name": "Category 1", "id": "0"}]``
   * - ``VDOC_PROJECT_CATEGORY_MAPPING``
     - An optional list of of project mappings.
     - ``{}``
     - ``{"project-01": "Category 1"}``

.. _configuration-file:

Configuration file
==================

Flat values are fine as environment variables. Structured ones are not: a list of footer link groups
or a mapping of project categories has to be squeezed into a single variable as JSON, on one line,
with nowhere to write down why any of it is the way it is.

So every setting can also come from a YAML file. **vdoc**'s own settings live under ``vdoc:`` and each
plugin's under ``plugins.<name>:``:

.. code-block:: yaml

   vdoc:
     docs_dir: /srv/vdoc/docs
     project_categories:
       - { id: 0, name: General }
       - { id: 1, name: Components }
     project_category_mapping:
       voraus-software-manual: General

   plugins:
     footer:
       # Comments are possible in here, which an environment variable can never carry
       copyright: Example GmbH
       links:
         - title: Links
           links:
             - title: Homepage
               icon: home
               href: https://example.com

The file is read from ``VDOC_CONFIG_FILE``, which defaults to ``/srv/vdoc/vdoc.yaml``. It is optional:
if it is not there, nothing happens.

**Environment variables take precedence.** The file only answers for settings the environment leaves
unset, so adding one cannot change what an already running deployment resolves to. Secrets are better
left in the environment regardless -- the file is meant for the structured, non-secret settings.

A file that is not valid YAML, or that holds a value a setting will not accept, stops the application
at startup rather than being ignored.

.. note::
   On a platform that offers no good way to write a file into the container, look for a file mount
   feature -- Dokploy, for instance, has one under *Advanced -> Mounts*, which takes the content and a
   path and keeps it across deployments.
