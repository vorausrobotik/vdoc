import { Box, Container, IconButton, Link, Paper, Tooltip, Typography, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { fetchPluginConfig } from '@/helpers/APIFunctions'
import type FooterPluginT from '@/interfacesAndTypes/plugins/FooterPlugin'
import { iconMap } from '@/interfacesAndTypes/plugins/FooterPlugin'
import testIDs from '@/interfacesAndTypes/testIDs'

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
      <Container maxWidth="xl" sx={{ py: 0.5 }}>
        {/* Copyright on one side and the links on the other, wrapping onto a second row where both do
            not fit beside each other */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 3,
          }}
        >
          {footerPluginConfig.copyright && (
            <Typography data-testid={testIDs.plugins.footer.copyright} variant="body2" color="text.secondary">
              © {new Date().getFullYear()} {footerPluginConfig.copyright}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, ml: 'auto' }}>
            {footerPluginConfig.links.map((linkGroup) => (
              // The group title is not printed, so it names the group for a screen reader
              <Box
                key={linkGroup.title}
                role="group"
                aria-label={linkGroup.title}
                data-testid={testIDs.plugins.footer.linkGroup.main}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {linkGroup.links.map((link) => {
                  const LinkIcon = iconMap[link.icon]
                  return (
                    <Tooltip key={link.href} title={link.title}>
                      <IconButton
                        data-testid={testIDs.plugins.footer.linkGroup.link.main}
                        aria-label={link.title}
                        component={Link}
                        href={link.href}
                        target={link.target}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Paper>
  )
}
