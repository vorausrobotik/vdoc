Site Plugin
===========

**vdoc** can be extended with a site plugin, which says what a given instance of vdoc is. vdoc itself
cannot know: it is a generic documentation host, and the same build serves whoever deploys it.

The values are used for two audiences at once. The landing page introduces itself with them above the
projects it serves, and ``llms.txt`` uses them as its heading and its summary, so that a reader and an
automated client are told the same thing about where they have arrived.

The plugin is active as soon as either the title or the description is set.

The following settings are available:

.. list-table:: Site Plugin Environment Variables
   :header-rows: 1

   * - Environment variable
     - Explanation
     - Default
     - Example
   * - ``VDOC_PLUGINS_SITE_TITLE``
     - The name of this documentation site. A short noun phrase rather than a sentence: it is a
       heading, and the description below explains.
     - ``None``
     - ``voraus robotik Software Documentation``
   * - ``VDOC_PLUGINS_SITE_DESCRIPTION``
     - One sentence on what this site holds. Worth naming the products it documents, since this is
       what a search over ``llms.txt`` matches against.
     - ``None``
     - ``Documentation for the voraus automation platform.``
   * - ``VDOC_PLUGINS_SITE_SHOW_ON_LANDING_PAGE``
     - Whether the landing page introduces itself with the title and the description. ``llms.txt``
       always uses them, because a client reading it has nothing else to go on.
     - ``True``
     - ``False``
