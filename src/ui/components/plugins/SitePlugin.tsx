import { alpha, Paper, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { fetchPluginConfig } from '../../helpers/APIFunctions'
import type SitePluginT from '../../interfacesAndTypes/plugins/SitePlugin'
import testIDs from '../../interfacesAndTypes/testIDs'

/**
 * What this instance of vdoc is, as a banner above the projects it serves.
 *
 * Fetched rather than taken from the landing page's route loader, so that the page still renders its
 * projects if the plugin cannot be read. It is an introduction, not a prerequisite.
 */
export const SitePlugin = () => {
  const [sitePluginConfig, setSitePluginConfig] = useState<SitePluginT | null>(null)

  useEffect(() => {
    fetchPluginConfig<SitePluginT>('site').then((config) => setSitePluginConfig(config))
  }, [])

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
        textAlign: 'center',
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
            mt: 1.5,
            // Centered, but still held to a readable measure rather than the full container width
            maxWidth: '68ch',
            mx: 'auto',
            lineHeight: 1.7,
            fontSize: { xs: '1rem', md: '1.125rem' },
          }}
          data-testid={testIDs.plugins.site.description}
        >
          {sitePluginConfig.description}
        </Typography>
      )}
    </Paper>
  )
}
