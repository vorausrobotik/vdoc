import { Container, Typography, Button, Link, Grid, Stack, Paper, Divider } from '@mui/material'
import { useEffect, useState } from 'react'
import FooterPluginT, { iconMap } from '../../interfacesAndTypes/plugins/FooterPlugin'
import testIDs from '../../interfacesAndTypes/testIDs'
import { fetchPluginConfig } from '../../helpers/APIFunctions'

export const FooterPlugin = () => {
  const [footerPluginConfig, setFooterPluginConfig] = useState<FooterPluginT | null>(null)

  useEffect(() => {
    fetchPluginConfig<FooterPluginT>('footer').then((config) => setFooterPluginConfig(config))
  }, [])

  if (footerPluginConfig == null || !footerPluginConfig.active) {
    return null
  }

  return (
    // For the elevation effect
    <Paper data-testid={testIDs.plugins.footer.main} component="footer" elevation={4}>
      {/* Centers content horizontally and restricts the width */}
      <Container maxWidth="xl" sx={{ py: 1 }}>
        <Grid container direction="row" alignItems="center" justifyContent="center" columnSpacing={6}>
          {/* Copyright */}
          {footerPluginConfig.copyright && (
            <Grid key={'Copyright'} data-testid={testIDs.plugins.footer.copyright}>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} {footerPluginConfig.copyright}
              </Typography>
            </Grid>
          )}
          {/* Link groups */}
          {footerPluginConfig.links.map((linkGroup) => {
            return (
              <div key={linkGroup.title}>
                <Divider orientation="vertical" flexItem sx={{ display: { md: 'none', lg: 'block' } }} />
                <Grid>
                  <Stack
                    data-testid={testIDs.plugins.footer.linkGroup.main}
                    direction="row"
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {/* Link group title */}
                    <Typography
                      data-testid={testIDs.plugins.footer.linkGroup.title}
                      variant="body2"
                      color="text.secondary"
                      mr={2}
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
                          sx={{ textTransform: 'none', mr: 1 }}
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
                  </Stack>
                </Grid>
              </div>
            )
          })}
        </Grid>
      </Container>
    </Paper>
  )
}
