import { createRootRoute, Outlet } from '@tanstack/react-router'
import MenuBar from '../MenuBar'
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <MenuBar />
        <Outlet />
      </Box>
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
})
