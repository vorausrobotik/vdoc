import { alpha, Box, Link, Paper, Typography } from '@mui/material'
import Markdown, { type Components } from 'react-markdown'
import type SitePluginT from '../../interfacesAndTypes/plugins/SitePlugin'
import testIDs from '../../interfacesAndTypes/testIDs'

/**
 * What the long description may render.
 *
 * Restricted rather than open: the banner owns its own type hierarchy, and a heading or an image
 * dropped into the configuration would fight it. Anything else is unwrapped rather than removed, so
 * unsupported markup degrades to its text instead of vanishing.
 */
const ALLOWED_ELEMENTS = ['p', 'a', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'br']

const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <Link
      href={href}
      // Only an absolute URL leaves the site, and only that should take over a new tab
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  ),
}

/** What this instance of vdoc is, as a banner above the projects it serves. */
export const SitePlugin = ({ config: sitePluginConfig }: { config: SitePluginT | null }) => {
  if (sitePluginConfig == null || !sitePluginConfig.active || !sitePluginConfig.show_on_landing_page) {
    return null
  }

  return (
    <Paper
      variant="outlined"
      data-testid={testIDs.plugins.site.main}
      sx={(theme) => ({
        mb: 4,
        px: { xs: 3, md: 5 },
        py: { xs: 3.5, md: 5 },
        borderRadius: 2,
        // A tint of the primary color rather than a surface color: the default dark palette gives
        // `background.paper` and `background.default` the same value, so a plain surface would be
        // invisible against the page in dark mode.
        backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(
          theme.palette.primary.main,
          0
        )} 65%)`,
      })}
    >
      {sitePluginConfig.title && (
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', md: '2.125rem' } }}
          data-testid={testIDs.plugins.site.title}
        >
          {sitePluginConfig.title}
        </Typography>
      )}
      {sitePluginConfig.description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mt: 1,
            maxWidth: '90ch',
            lineHeight: 1.7,
            fontSize: { xs: '1rem', md: '1.125rem' },
          }}
          data-testid={testIDs.plugins.site.description}
        >
          {sitePluginConfig.description}
        </Typography>
      )}
      {sitePluginConfig.long_description && sitePluginConfig.long_description.length > 0 && (
        <Box
          data-testid={testIDs.plugins.site.longDescription}
          sx={{
            mt: 2,
            maxWidth: '90ch',
            color: 'text.secondary',
            lineHeight: 1.7,
            fontSize: { xs: '0.95rem', md: '1.0625rem' },
            '& p': { m: 0 },
            '& p + p, & p + ul, & p + ol, & ul + p, & ol + p': { mt: 1.5 },
            '& ul, & ol': { my: 0, pl: 3 },
            '& li + li': { mt: 0.25 },
            '& code': {
              px: 0.5,
              borderRadius: 0.5,
              bgcolor: 'action.hover',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
          }}
        >
          <Markdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed components={MARKDOWN_COMPONENTS}>
            {sitePluginConfig.long_description.join('\n')}
          </Markdown>
        </Box>
      )}
    </Paper>
  )
}
