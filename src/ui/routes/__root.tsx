import { createRootRoute, Outlet } from '@tanstack/react-router'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import MenuBar from '../components/MenuBar'
import { FooterPlugin } from '../components/plugins/FooterPlugin'
import { Box, CssBaseline, ThemeProvider, createTheme, useColorScheme } from '@mui/material'
const theme = createTheme({
  colorSchemes: {
    light: true,
    dark: true,
  },
})

function ThemedComponent() {
  const { mode } = useColorScheme()

  // The mode is always undefined on first render, without this return you encounter a hydration mismatch error.
  // Details: https://mui.com/material-ui/customization/dark-mode/#toggling-color-mode
  if (!mode) {
    return null
  }
  return (
    <Box id="rootComponent" sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <MenuBar />
      <Box
        sx={{
          height: '100vh',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
      <FooterPlugin />
    </Box>
  )
}

function RootComponent() {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <InitColorSchemeScript />
      <ThemedComponent />
    </ThemeProvider>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
