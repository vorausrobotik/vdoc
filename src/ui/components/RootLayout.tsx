import { Box, CssBaseline, Slide, ThemeProvider, useColorScheme } from '@mui/material'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { getRouteApi, Outlet } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ContentInsetProvider } from '../contexts/ContentInsetProvider'
import { useIFrameScroll } from '../contexts/IFrameScrollContext'
import { IFrameScrollProvider } from '../contexts/IFrameScrollProvider'
import { buildTheme } from '../helpers/Theme'
import MenuBar from './MenuBar'
import { FooterPlugin } from './plugins/FooterPlugin'
import ScrollToTop from './ScrollToTop'

const route = getRouteApi('__root__')

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
  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)

  const footerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      setFooterHeight(0)
      return
    }
    const observer = new ResizeObserver(() => {
      setFooterHeight(node.getBoundingClientRect().height)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

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
      <MenuBar hide={hideElements} onHeightChange={setHeaderHeight} />
      <Box
        data-testid="contentArea"
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          pt: hideElements ? 0 : `${headerHeight}px`,
          pb: hideElements ? 0 : `${footerHeight}px`,
          // Not animated until the header has been measured, so that its first measurement lands
          // rather than sliding the content down from zero.
          transition: headerHeight ? 'padding 0.3s' : 'none',
        }}
      >
        <Outlet />
      </Box>
      <Slide appear={false} direction="up" in={!hideElements}>
        <Box ref={footerRef} sx={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 1100 }}>
          <FooterPlugin />
        </Box>
      </Slide>
      <ScrollToTop visible={showScrollToTop} onScrollToTop={handleScrollToTop} />
    </Box>
  )
}

export function RootComponent() {
  const { themePluginConfig } = route.useLoaderData()
  const theme = useMemo(() => buildTheme(themePluginConfig), [themePluginConfig])

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <InitColorSchemeScript />
      <IFrameScrollProvider>
        <ContentInsetProvider>
          <ThemedComponent />
        </ContentInsetProvider>
      </IFrameScrollProvider>
    </ThemeProvider>
  )
}
