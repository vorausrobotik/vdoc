Configuration
#############

**vdoc** is configured from a YAML file, from environment variables, or from both. Internally it uses
`pydantic-settings <https://docs.pydantic.dev/latest/concepts/pydantic_settings/>`_ for building the
configuration.

.. _configuration-file:

Configuration file
==================

The file is read from the path in ``VDOC_CONFIG_FILE``, which defaults to ``/srv/vdoc/vdoc.yaml``. It
is optional: if it is not there, nothing happens. **vdoc**'s own settings live under ``vdoc`` and each
plugin's under ``plugins.<name>``:

.. code-block:: yaml

   vdoc:
     docs_dir: /srv/vdoc/docs
     project_categories:
       - { id: 0, name: General }
       - { id: 1, name: Components }
     project_category_mapping:
       example-project: General
     project_display_name_mapping:
       example-project: Example Project

   plugins:
     site:
       title: Example Software Documentation
     footer:
       # A comment, which an environment variable can never carry
       copyright: Example Org

A file that is not valid YAML, or that holds a value a setting will not accept, stops the application
at startup rather than being ignored. A section that is present but is not a mapping is ignored.

.. note::
   On a platform that offers no good way to write a file into the container, look for a file mount
   feature -- Dokploy, for instance, has one under *Advanced -> Mounts*, which takes the content and a
   path and keeps it across deployments. Be aware that per-pull-request preview deployments there get
   their own directory, into which the file is not copied.

Environment variables
=====================

Every setting can equally be given as an environment variable, prefixed with ``VDOC_``, and **an
environment variable takes precedence over the file**. That is what lets a single value be overridden
without editing anything, and it is where secrets belong -- a file is likelier than a variable to end
up in version control.

The catch is that a variable left over from before the file existed silently shadows what the file
says. The path being read is logged at startup, and says as much:

.. code-block:: text

   Reading configuration from '/srv/vdoc/vdoc.yaml'. Environment variables override what it sets.

A setting whose value is a list or a mapping has to be written as JSON in a variable, on a single
line, which is the reason the file is worth having. A setting that holds a structure of its own is
addressed with ``__`` between the levels, for example ``VDOC_PLUGINS_THEME_LIGHT__LOGO_URL``.

Settings
========

The environment variable for a setting is ``VDOC_`` followed by its name in upper case. Plugin
settings are documented on their own pages under :doc:`plugins`.

.. list-table:: VDoc Configuration
   :widths: 25 25 25 25
   :header-rows: 1

   * - Setting
     - Explanation
     - Default
     - Example
   * - ``config_file``
     - The path of the configuration file itself. Environment variable only, since it decides where
       the file is read from and so cannot come from it.
     - ``/srv/vdoc/vdoc.yaml``
     - ``/etc/vdoc/vdoc.yaml``
   * - ``docs_dir``
     - The directory to which all project documentations will be uploaded.
     - ``/srv/vdoc/docs/``
     - ``/path/to/your/docs/``
   * - ``api_username``
     - The username required for uploading documentations via the API.
     - ``admin``
     - ``Something more secure``
   * - ``api_password``
     - The password required for uploading documentations via the API. Better kept in the
       environment than in the file.
     - ``admin``
     - ``sup3r_s3cr3t``
   * - ``bind_address``
     - The application bind address.
     - ``0.0.0.0``
     - ``127.0.0.1``
   * - ``bind_port``
     - The application bind port.
     - ``8080``
     - ``1337``
   * - ``project_display_name_mapping``
     - An optional mapping of project names to display names.
     - ``{}``
     - ``{"project-01": "Project Name"}``
   * - ``project_categories``
     - An optional list of project categories.
     - ``[]``
     - ``[{"name": "Category 1", "id": 0}]``
   * - ``project_category_mapping``
     - An optional mapping of project names to category names.
     - ``{}``
     - ``{"project-01": "Category 1"}``
