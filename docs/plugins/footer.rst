Footer Plugin
=============

**vdoc** can be extended with a footer plugin.

The following settings are available:

.. list-table:: Footer Plugin Environment Variables
   :header-rows: 1

   * - Environment variable
     - Explanation
     - Default
     - Example
   * - ``VDOC_PLUGINS_FOOTER_COPYRIGHT``
     - The copyright holder without copyright mark or year.
     - ``None``
     - ``Example Org``
   * - ``VDOC_PLUGINS_FOOTER_LINKS``
     - A list of link groups to display in the footer.
     - ``[]``
     - ``[{"title": "Contact", "links": [{"title": "Email", "icon": "email", "href": "mailto:service@example.com"}]}]``
