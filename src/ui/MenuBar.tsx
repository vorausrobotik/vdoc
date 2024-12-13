import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Container } from '@mui/material'

export default function MenuBar() {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters variant="dense">
          <Typography
            variant="h6"
            noWrap
            component="a"
            href={'/'}
            sx={{
              mr: 2,
              textDecoration: 'none',
              color: 'inherit',
              display: { xs: 'none', md: 'flex' },
            }}
          >
            VDoc
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
