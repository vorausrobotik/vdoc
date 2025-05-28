Theme Plugin
============

**vdoc** can be extended with a theme plugin.

.. note::
   ``<MODE>`` can be either ``DARK`` or ``LIGHT``.

The following settings are available:

.. list-table:: Theme Plugin Environment Variables
   :header-rows: 1

   * - Environment variable
     - Explanation
     - Default
     - Example
   * - ``VDOC_PLUGINS_THEME_<MODE>__LOGO_URL``
     - The URL of the logo to be used in the frontend.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
     - ``https://example.com/logo.png``
   * - ``VDOC_PLUGINS_THEME_<MODE>__LOGO_URL_SMALL``
     - The URL of the small logo to be used in the frontend.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
     - ``https://example.com/logo.png``
