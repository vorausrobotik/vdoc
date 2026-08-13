Site Plugin
===========

**vdoc** can be extended with a site plugin, which says what a given instance of vdoc is. vdoc itself
cannot know: it is a generic documentation host, and the same build serves whoever deploys it.

The values are used for two audiences at once. The landing page introduces itself with them above the
projects it serves, and ``llms.txt`` uses them as its heading and its summary, so that a reader and an
automated client are told the same thing about where they have arrived.

The plugin is active as soon as any of the title, the description or the long description is set.

The long description is markdown because the other consumer of it is ``llms.txt``, which is itself a
markdown document: written as markdown it needs no conversion on the way there, where any other
markup would need a lossy one. Only ``p``, ``a``, ``strong``, ``em``, ``code``, ``ul``, ``ol``,
``li`` and ``br`` are rendered -- the banner owns its own type hierarchy, so a heading or an image
would fight it -- and anything else degrades to its text rather than disappearing. Raw HTML is never
rendered.

It is configured as a JSON list of lines rather than as one string with line breaks in it. Markdown is
line based, and an environment variable is a poor place to keep line breaks -- a deployment platform's
web form tends to flatten them. An empty element is a blank line, which is how markdown starts a new
paragraph:

.. code-block:: sh

   VDOC_PLUGINS_SITE_LONG_DESCRIPTION='["A paragraph.", "", "- first item", "- second item"]'

A value that is not a JSON list fails at startup rather than reaching the landing page.

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
   * - ``VDOC_PLUGINS_SITE_LONG_DESCRIPTION``
     - Markdown as a JSON list of lines, for whatever needs more room than one sentence. Rendered
       below the description.
     - ``None``
     - ``["- **voraus.core** -- the real-time runtime"]``
   * - ``VDOC_PLUGINS_SITE_SHOW_ON_LANDING_PAGE``
     - Whether the landing page introduces itself with the title and the description. ``llms.txt``
       always uses them, because a client reading it has nothing else to go on.
     - ``True``
     - ``False``
