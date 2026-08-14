import { createConfig } from '@voraus/docusaurus-theme'

import pkg from './package.json'

// vdoc's own documentation is published to GitHub Pages rather than through a vdoc
// instance, so `url` and `baseUrl` override the theme's vdoc-hosted defaults. The values
// come from `actions/configure-pages` in the workflow, so a fork publishes under its own
// account without editing anything; the fallbacks are what this repository publishes as.
//
// `||` rather than `??` on purpose: the workflow passes these through unconditionally, so an
// unset value arrives as an empty string rather than as undefined.
export default createConfig({
  title: 'vdoc',
  tagline: 'Multi version documentation hosting.',
  projectName: 'vdoc',
  version: pkg.version,
  url: process.env.DOCS_URL || 'https://vorausrobotik.github.io',
  baseUrl: process.env.DOCS_BASE_URL || '/vdoc/',
  favicon: 'img/voraus_logo_small.svg',
  docs: {
    // The docs are the whole site, so they answer at its root rather than under `/docs/`.
    // Without this nothing serves `/`, which the navbar's own home link points at.
    routeBasePath: '/',
    // Joined with each page's path below `docs/`, so this is the directory that holds them.
    editUrl: 'https://github.com/vorausrobotik/vdoc/tree/main/docs/docs/',
  },
  config: {
    // Third-party metadata lands in the generated license compliance page verbatim, and an
    // author line such as `Name <name@example.com>` is valid markdown but invalid MDX -- it
    // reads as a JSX tag. Parsing `.md` as CommonMark keeps a generated page from being able
    // to break the build; `.mdx` still gets the full MDX pipeline, so a page that wants
    // components asks for them by its extension.
    markdown: { format: 'detect' },
  },
  customCss: './src/css/custom.css',
  navbarItems: [
    {
      href: 'https://github.com/vorausrobotik/vdoc',
      // No label: `custom.css` renders the GitHub mark for this class instead.
      position: 'right',
      className: 'header-github-link',
      'aria-label': 'vdoc on GitHub',
    },
  ],
})
