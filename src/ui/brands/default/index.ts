import { createTheme } from '@mui/material/styles'
import vdocIcon from '@/icons/vdoc.svg'
import type { Brand } from '../Brand'
import { Header, Hero, SectionLabel, VersionBadge } from './components'

const theme = createTheme({
  colorSchemes: { dark: true },
  // `h3` titles a card in both brands, as the voraus type scale defines it. Material UI's own `h3` is a
  // display size, so it takes the size Material UI gives `h6`.
  typography: { h3: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.6 } },
  components: {
    // Material UI pads the actions of a card by half of what it pads the content by, which sets the
    // footer of a card in from the text above it
    MuiCardActions: { styleOverrides: { root: ({ theme }) => ({ padding: theme.spacing(1, 2, 2) }) } },
    MuiPaper: {
      variants: [
        {
          // The voraus theme declares `tile` and `@voraus/css` draws it. Material UI's own look has no
          // drawing for it, and would render a tile without an edge.
          props: { variant: 'tile' },
          style: ({ theme }) => ({
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            border: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create(['border-color', 'box-shadow']),
            '&:hover': { borderColor: theme.palette.primary.main, boxShadow: theme.shadows[2] },
          }),
        },
      ],
    },
  },
})

export const brand: Brand = {
  theme,
  favicon: vdocIcon,
  Header,
  Hero,
  SectionLabel,
  VersionBadge,
  primaryButton: 'contained',
  contentWidth: '1200px',
}
