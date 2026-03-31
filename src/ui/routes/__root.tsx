import { createRootRoute, Outlet } from '@tanstack/react-router'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import MenuBar from '../components/MenuBar'
import { FooterPlugin } from '../components/plugins/FooterPlugin'
import ScrollToTop from '../components/ScrollToTop'
import { Box, CssBaseline, ThemeProvider, createTheme, useColorScheme, Slide } from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import { IFrameScrollProvider, useIFrameScroll } from '../contexts/IFrameScrollContext'

const theme = createTheme({
  colorSchemes: {
    light: true,
    dark: true,
  },
})

/**
 * Determines whether navigation elements should be hidden based on scroll behavior.
 *
 * Uses viewport-relative thresholds to work consistently across different screen sizes.
 *
 * Hysteresis (different hide/show thresholds) prevents flickering when page content
 * is only slightly larger than the viewport - without it, hiding the nav would make
 * the page shorter, causing it to immediately show again in an infinite loop.
 *
 * @param scrollY - Current scroll position in pixels
 * @param isScrollingDown - Whether user is currently scrolling down
 * @param currentlyHidden - Current visibility state of navigation
 * @param viewportHeight - Height of the viewport in pixels
 * @returns true if navigation should be hidden, false otherwise
 */
function shouldHideNavigation(
  scrollY: number,
  isScrollingDown: boolean,
  currentlyHidden: boolean,
  viewportHeight: number
): boolean {
  const HIDE_THRESHOLD_PERCENT = 0.1 // Hide when scrolled past 10% of viewport height
  const SHOW_THRESHOLD_PERCENT = 0.025 // Show when scrolled back above 2.5% of viewport height

  const hideThreshold = viewportHeight * HIDE_THRESHOLD_PERCENT
  const showThreshold = viewportHeight * SHOW_THRESHOLD_PERCENT

  if (isScrollingDown && scrollY > hideThreshold) {
    return true
  } else if (!isScrollingDown && scrollY < showThreshold) {
    return false
  }

  return currentlyHidden
}

function ThemedComponent() {
  const { mode } = useColorScheme()
  const { scrollY } = useIFrameScroll()
  const lastScrollY = useRef(0)
  const [hideElements, setHideElements] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  useEffect(() => {
    const isScrollingDown = scrollY > lastScrollY.current
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
    const viewportHeight = iframe?.contentWindow?.innerHeight || window.innerHeight

    setHideElements((currentHideState) => {
      return shouldHideNavigation(scrollY, isScrollingDown, currentHideState, viewportHeight)
    })

    // Update scroll-to-top button visibility
    const shouldShowScrollToTop = scrollY > viewportHeight * 0.1
    setShowScrollToTop(shouldShowScrollToTop)

    lastScrollY.current = scrollY
  }, [scrollY])

  // The mode is always undefined on first render, without this return you encounter a hydration mismatch error.
  // Details: https://mui.com/material-ui/customization/dark-mode/#toggling-color-mode
  if (!mode) {
    return null
  }

  const handleScrollToTop = () => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null
    iframe?.contentWindow?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box id="rootComponent" sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <MenuBar hide={hideElements} />
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          pt: hideElements ? 0 : '64px',
          pb: hideElements ? 0 : '64px',
          transition: 'padding 0.3s',
        }}
      >
        <Outlet />
      </Box>
      <Slide appear={false} direction="up" in={!hideElements}>
        <Box sx={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 1100 }}>
          <FooterPlugin />
        </Box>
      </Slide>
      <ScrollToTop visible={showScrollToTop} onScrollToTop={handleScrollToTop} />
    </Box>
  )
}

function RootComponent() {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <InitColorSchemeScript />
      <IFrameScrollProvider>
        <ThemedComponent />
      </IFrameScrollProvider>
    </ThemeProvider>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
