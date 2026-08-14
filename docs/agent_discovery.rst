.. _agent-discovery:

Agent and crawler discovery
###########################

A reader with a browser finds their way around **vdoc**'s interface. A client that does not run
JavaScript does not: a crawler, a link checker or an agent fetching a URL receives an almost empty HTML
shell from every readable address, and nothing in that shell points at the address that does carry the
page.

**vdoc** therefore states the situation in two files such a client already looks for. Both are generated
from what is actually published, so an upload is enough to appear in them and neither can drift out of
date.

What an automated client needs to know
======================================

Every page has two addresses. ``/<project>/<version>/<page>`` answers with **vdoc**'s application;
``/static/projects/<project>/<version>/<page>`` is the page itself. :doc:`frame_contract` explains why
that split exists and how the two map onto each other. The consequence here is one line:
**fetch the static address.**

``/llms.txt``
=============

An index following the `llms.txt convention <https://llmstxt.org/>`_: a markdown file at the site root
that tells an automated reader what a site holds and where to fetch it.

It contains, in this order:

- the site's name and one-sentence summary, from the :doc:`site plugin <plugins/site>`
- how the two addresses relate, and that ``latest`` stands in for a version
- a link to ``/openapi.json``, for a client that would rather read JSON
- every project, grouped by its configured category, linked at the **newest published version** by its
  static address
- an ``## Optional`` section listing whatever machine-readable page index each version happens to ship

The page indexes are the part worth knowing about. Rather than crawling a version page by page, a client
can read the index the generator already wrote:

.. list-table::
   :header-rows: 1

   * - File
     - Written by
     - Contains
   * - ``objects.inv``
     - Sphinx
     - Every page and cross-reference target, zlib-compressed
   * - ``sitemap.xml``
     - Docusaurus
     - Every page URL
   * - ``search-index.json``
     - Docusaurus
     - The title and URL of every page, plus its text

**vdoc** advertises the ones a published version actually contains, so a project is described by what it
has rather than by which generator built it. Sphinx's ``searchindex.js`` is deliberately left out: it
says nothing ``objects.inv`` does not already say, and listing both doubled the section for no gain.

``/robots.txt``
===============

A `Robots Exclusion Protocol <https://www.rfc-editor.org/rfc/rfc9309.html>`_ file. Nothing is
disallowed -- every published page is meant to be read -- and its real purpose here is to point at
``/llms.txt``, which no crawler would otherwise know to look for.

Configuring what they say
=========================

Neither file has settings of its own. The name and the summary come from the
:doc:`site plugin <plugins/site>`, the grouping from ``project_categories`` and
``project_category_mapping`` in the :ref:`configuration <configuration-file>`, and everything else from
the documentation directory.

.. code-block:: yaml

   plugins:
     site:
       title: Example Software Documentation
       description: Documentation for the Example automation platform.

That title becomes the heading of ``llms.txt``, and the description its summary. Without them the file
still renders, under a generic heading.

Absolute URLs and reverse proxies
=================================

Both files list absolute URLs, so that they keep working once copied away from the site they came from.
The host is taken from the request, honoring ``X-Forwarded-Proto`` and ``X-Forwarded-Host`` so that a
**vdoc** behind a reverse proxy names the address readers actually use rather than its own container.

Trying it
=========

.. code-block:: sh

   curl https://your-vdoc.example.com/llms.txt
   curl https://your-vdoc.example.com/robots.txt

A useful check, if something looks wrong: every link in ``llms.txt`` should answer ``200``. A readable
address that answers ``404`` means the version is gone; a static address that does means the file is.
