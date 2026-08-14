import { Box, Button, Container, Divider, Link, Paper, Typography, useTheme } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { fetchPluginConfig } from '../../helpers/APIFunctions'
import type FooterPluginT from '../../interfacesAndTypes/plugins/FooterPlugin'
import { iconMap } from '../../interfacesAndTypes/plugins/FooterPlugin'
import testIDs from '../../interfacesAndTypes/testIDs'

export const FooterPlugin = () => {
  const [footerPluginConfig, setFooterPluginConfig] = useState<FooterPluginT | null>(null)

  const theme = useTheme()

  useEffect(() => {
    fetchPluginConfig<FooterPluginT>('footer').then((config) => setFooterPluginConfig(config))
  }, [])

  if (footerPluginConfig == null || !footerPluginConfig.active) {
    return null
  }

  return (
    // Opaque, because the content area scrolls underneath it
    <Paper
      data-testid={testIDs.plugins.footer.main}
      component="footer"
      elevation={4}
      sx={{ background: theme.palette.background.default }}
    >
      {/* Centers content horizontally and restricts the width */}
      <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* Wraps rather than overflows: where one row is not enough, the copyright and each link
            group take a row of their own instead of being squeezed into one. */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: { xs: 2, lg: 6 },
            rowGap: 1,
          }}
        >
          {/* Copyright */}
          {footerPluginConfig.copyright && (
            <Typography data-testid={testIDs.plugins.footer.copyright} variant="body2" color="text.secondary">
              © {new Date().getFullYear()} {footerPluginConfig.copyright}
            </Typography>
          )}
          {/* Link groups */}
          {footerPluginConfig.links.map((linkGroup, index) => {
            return (
              <Fragment key={linkGroup.title}>
                {/* A separator only where everything fits on one row: on a wrapped row it would end
                    up at the end of a line rather than between two groups. A direct child of the
                    flex row, because that is what gives `flexItem` a height to stretch to. */}
                {(index > 0 || footerPluginConfig.copyright) && (
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
                )}
                <Box
                  data-testid={testIDs.plugins.footer.linkGroup.main}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  {/* Link group title */}
                  <Typography
                    data-testid={testIDs.plugins.footer.linkGroup.title}
                    variant="body2"
                    color="text.secondary"
                  >
                    {linkGroup.title}
                  </Typography>
                  {/* Link group links */}
                  {linkGroup.links.map((link) => {
                    const LinkIcon = iconMap[link.icon]
                    return (
                      <Button
                        data-testid={testIDs.plugins.footer.linkGroup.link.main}
                        key={link.href}
                        sx={{ textTransform: 'none' }}
                        component={Link}
                        href={link.href}
                        target={link.target}
                        startIcon={<LinkIcon />}
                        variant="outlined"
                      >
                        {link.title}
                      </Button>
                    )
                  })}
                </Box>
              </Fragment>
            )
          })}
        </Box>
      </Container>
    </Paper>
  )
}
