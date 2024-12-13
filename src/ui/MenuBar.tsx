import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Container } from '@mui/material'
import VDocLogo from './icons/VDocLogo'

export default function MenuBar() {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters variant="dense" sx={{ py: 1 }}>
          <VDocLogo height={50} width={50} viewBox="0 0 100 100" />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href={'/'}
            sx={{
              ml: 4,
              textDecoration: 'none',
              color: 'inherit',
              display: { xs: 'none', md: 'flex' },
            }}
          >
            vdoc
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
