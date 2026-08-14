Theme Plugin
============

**vdoc** can be extended with a theme plugin, which carries the logo the frontend shows. Its settings
are given per color mode, because a logo that reads on a light background usually does not read on a
dark one.

Configuration
-------------

Under ``plugins.theme`` in the :ref:`configuration file <configuration-file>`, with a ``light`` and a
``dark`` section:

.. code-block:: yaml

   plugins:
     theme:
       light:
         logo_url: https://example.com/logo.png
         logo_url_small: https://example.com/logo-small.png
       dark:
         logo_url: https://example.com/logo-negative.png
         logo_url_small: https://example.com/logo-small-negative.png

Every setting can equally be given as an environment variable, which then takes precedence over the
file. Because these settings sit inside a color mode, the variable name has ``__`` between the two
levels:

.. code-block:: sh

   VDOC_PLUGINS_THEME_LIGHT__LOGO_URL='https://example.com/logo.png'
   VDOC_PLUGINS_THEME_DARK__LOGO_URL='https://example.com/logo-negative.png'

Settings
--------

Both are available under ``light`` and under ``dark``:

.. list-table:: Theme Plugin Settings
   :header-rows: 1

   * - Setting
     - Explanation
     - Default
     - Example
   * - ``logo_url``
     - The URL of the logo to be used in the frontend.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
     - ``https://example.com/logo.png``
   * - ``logo_url_small``
     - The URL of the small logo, used where the viewport is too narrow for the full one.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
     - ``https://example.com/logo-small.png``

The environment variable for a setting is ``VDOC_PLUGINS_THEME_<MODE>__`` followed by its name in
upper case, where ``<MODE>`` is ``LIGHT`` or ``DARK``.

Without a logo the frontend falls back to rendering the text ``vdoc`` in the app bar.
