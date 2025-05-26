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
