import { AppBar, Box, Paper, Toolbar, Typography } from '@mui/material'
import { ContentColumn } from '@/components/ContentColumn'
import { VdocLogo } from '@/components/VdocLogo'
import testIDs from '@/interfacesAndTypes/testIDs'
import type { HeaderProps, HeroProps, SectionLabelProps } from '../Brand'

export function Header({ search, actions, 'data-testid': testID }: HeaderProps) {
  return (
    <AppBar position="static" elevation={0} data-testid={testID} sx={{ bgcolor: 'background.default' }}>
      <Toolbar>
        {/* The outer groups take the width their content needs and the search bar takes what is
            left, so no breakpoint has to guess a column split for them. */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box
            component="a"
            href="/"
            data-testid={testIDs.header.logo.main}
            sx={{ display: 'flex', flexShrink: 0, alignItems: 'center', mr: 2, textDecoration: 'none' }}
          >
            <VdocLogo sx={{ mr: 1 }} />
            <Typography data-testid={testIDs.header.logo.text} variant="h6" sx={{ color: 'text.primary' }}>
              vdoc
            </Typography>
          </Box>
          {/* `minWidth` lets the search shrink below its content rather than push the groups beside
              it off the bar */}
          <Box sx={{ display: 'flex', flex: 1, minWidth: 0, justifyContent: 'center' }}>{search}</Box>
          <Box sx={{ display: 'flex', flexShrink: 0, justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
            {actions}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

/** A banner in the content column. */
export function Hero({ title, lead, children, actions, 'data-testid': testID }: HeroProps) {
  return (
    <ContentColumn sx={{ pt: 3 }}>
      <Paper
        variant="outlined"
        data-testid={testID}
        sx={(theme) => ({
          px: { xs: 3, md: 5 },
          py: { xs: 3.5, md: 5 },
          borderRadius: 2,
          // A tint of the primary color rather than a surface color: the default dark palette gives
          // `background.paper` and `background.default` the same value, so a plain surface would be
          // invisible against the page in dark mode.
          backgroundImage: `linear-gradient(135deg, ${theme.alpha(theme.palette.primary.main, 0.12)}, ${theme.alpha(
            theme.palette.primary.main,
            0
          )} 65%)`,
        })}
      >
        {title && (
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
            {title}
          </Typography>
        )}
        {lead && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: '90ch', lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}
          >
            {lead}
          </Typography>
        )}
        {children}
        {actions && <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{actions}</Box>}
      </Paper>
    </ContentColumn>
  )
}

export function SectionLabel({ children, 'data-testid': testID }: SectionLabelProps) {
  return (
    <Typography variant="h5" sx={{ mb: 2, textTransform: 'uppercase' }} data-testid={testID}>
      {children}
    </Typography>
  )
}

export function VersionBadge({ version }: { version: string }) {
  return (
    <Typography variant="caption" color="primary" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
      {version}
    </Typography>
  )
}
