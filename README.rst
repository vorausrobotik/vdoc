.. image:: https://github.com/vorausrobotik/vdoc/actions/workflows/pipeline.yml/badge.svg
    :target: https://github.com/vorausrobotik/vdoc/actions/workflows/pipeline.yml
    :class: badge
.. image:: https://codecov.io/gh/vorausrobotik/vdoc/graph/badge.svg
    :target: https://codecov.io/gh/vorausrobotik/vdoc
    :class: badge
.. image:: https://img.shields.io/pypi/pyversions/vdoc
    :target: https://pypi.org/project/vdoc
    :class: badge
.. image:: https://img.shields.io/pypi/v/vdoc
    :target: https://pypi.org/project/vdoc
    :class: badge
.. image:: https://img.shields.io/badge/%20imports-isort-%231674b1?style=flat&labelColor=ef8336
    :target: https://pycqa.github.io/isort/
    :class: badge
.. image:: https://img.shields.io/badge/code%20style-black-000000.svg
    :target: https://github.com/psf/black
    :class: badge

####
vdoc
####

Multi version documentation hosting.


Basic usage
###########


Run **vdoc** with python
************************

..  code-block:: shell

    pip install vdoc
    vdoc run


Run **vdoc** with docker
************************


..  code-block:: shell

    docker run -p 8080:8080 -v ./vdoc-docs:/srv/vdoc/docs/ voraus.jfrog.io/docker/vdoc:latest


Building vdoc
#############

..  code-block:: shell

    # Prepare development environment
    npm ci
    python -m venv venv
    source venv/bin/activate
    pip install --upgrade pip tox

    # Build UI
    npm run build

    # Build docs
    tox run -e docs

    # Build python package
    tox run -e build

    # Build local docker image
    docker build -t vdoc:latest .


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
   * - ``VDOC_LOGO_LIGHT_URL``
     - The URL to the light logo.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
     - ``https://example.com/light-mode-logo.png``
   * - ``VDOC_LOGO_DARK_URL``
     - The URL to the dark logo.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
     - ``https://example.com/dark-mode-logo.png``
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
