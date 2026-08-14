Theme Plugin
============

**vdoc** can be extended with a theme plugin, which carries the logo and the colors the frontend uses.
Most of its settings are given per color mode, because a value that reads on a light background usually
does not read on a dark one.

Every setting is optional, and leaving one unset keeps the framework's own default for it. An
unconfigured instance therefore looks exactly as vdoc looks without the plugin, which is what keeps a
generic build free of anybody's branding.

Configuration
-------------

Under ``plugins.theme`` in the :ref:`configuration file <configuration-file>`:

.. code-block:: yaml

   plugins:
     theme:
       # Shape is not a property of a color mode, so it sits beside the two
       border_radius: 0
       flat_cards: true

       light:
         logo_url: https://example.com/logo.png
         logo_url_small: https://example.com/logo-small.png
         palette:
           primary: "#E133FF"
           divider: "#E7E7EA"

       dark:
         logo_url: https://example.com/logo-negative.png
         logo_url_small: https://example.com/logo-small-negative.png
         palette:
           primary: "#00CFC6"
           divider: "#2A2A30"
           background_default: "#0C0C0E"
           background_paper: "#0C0C0E"

Every setting can equally be given as an environment variable, which then takes precedence over the
file. Since these sit inside a color mode and, for the palette, one level deeper again, the variable
name has ``__`` between the levels:

.. code-block:: sh

   VDOC_PLUGINS_THEME_BORDER_RADIUS=0
   VDOC_PLUGINS_THEME_LIGHT__LOGO_URL='https://example.com/logo.png'
   VDOC_PLUGINS_THEME_DARK__PALETTE__PRIMARY='#00CFC6'

Settings
--------

.. list-table:: Theme Plugin Settings
   :header-rows: 1

   * - Setting
     - Explanation
     - Default
   * - ``border_radius``
     - How round every corner is, in pixels. ``0`` for square.
     - the framework's own
   * - ``flat_cards``
     - Whether cards are drawn as a plain outline instead of a raised surface.
     - ``False``
   * - ``<mode>.logo_url``
     - The URL of the logo to be used in the frontend.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
   * - ``<mode>.logo_url_small``
     - The URL of the small logo, used where the viewport is too narrow for the full one.
     - ``https://logos.vorausrobotik.com/v_rgb.png``
   * - ``<mode>.palette.primary``
     - The color of links, buttons and anything else the interface treats as actionable.
     - the framework's own
   * - ``<mode>.palette.divider``
     - The color of borders and separators, including the outline of a card.
     - the framework's own
   * - ``<mode>.palette.background_default``
     - The color of the page itself.
     - the framework's own
   * - ``<mode>.palette.background_paper``
     - The color of surfaces on the page, such as cards.
     - the framework's own

``<mode>`` is ``light`` or ``dark``. A color has to be a CSS hex value such as ``#00CFC6``; anything
else fails at startup rather than rendering as no color at all.

Without a logo the frontend falls back to rendering the text ``vdoc`` in the app bar.

Adding a palette value
----------------------

The palette deliberately exposes a small set rather than all of the framework's. Supporting one more is
two lines: a field on ``ThemePalette`` in ``src/vdoc/models/plugins/theme.py``, and the line that maps
it in ``paletteFor`` in ``src/ui/helpers/Theme.ts``. The names match the framework's own palette slots
so that there is nothing to translate in between.
