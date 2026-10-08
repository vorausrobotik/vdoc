import { Box, CssBaseline, Slide, ThemeProvider, useColorScheme } from '@mui/material'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { getRouteApi, Outlet } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { COLOR_SCHEME_ATTRIBUTE } from '@/brands/Brand'
import { ContentInsetProvider } from '@/contexts/ContentInsetProvider'
import { useIFrameScroll } from '@/contexts/IFrameScrollContext'
import { IFrameScrollProvider } from '@/contexts/IFrameScrollProvider'
import MenuBar from './MenuBar'
import { FooterPlugin } from './plugins/FooterPlugin'
import ScrollToTop from './ScrollToTop'

const route = getRouteApi('__root__')

/**
 * Determines whether navigation elements should be hidden based on scroll behavior.
 *
 * Uses viewport-relative thresholds to work consistently across different screen sizes.
 *
 * Hiding the navigation grows the frame by its height, which takes the same amount of scroll room
 * from the page. On a page that is only slightly taller than the frame, the browser then clamps the
 * scroll position back up, the navigation shows again, and the page bounces. The navigation is
 * therefore only hidden when the page can still scroll past the hide threshold without it.
 *
 * @param scrollY - Current scroll position in pixels
 * @param isScrollingDown - Whether user is currently scrolling down
 * @param currentlyHidden - Current visibility state of navigation
 * @param viewportHeight - Height of the viewport in pixels
 * @param hiddenScrollRoom - How far the page could scroll with the navigation hidden, in pixels
 * @returns true if navigation should be hidden, false otherwise
 */
function shouldHideNavigation(
  scrollY: number,
  isScrollingDown: boolean,
  currentlyHidden: boolean,
  viewportHeight: number,
  hiddenScrollRoom: number
): boolean {
  const HIDE_THRESHOLD_PERCENT = 0.1 // Hide when scrolled past 10% of viewport height
  const SHOW_THRESHOLD_PERCENT = 0.025 // Show when scrolled back above 2.5% of viewport height

  const hideThreshold = viewportHeight * HIDE_THRESHOLD_PERCENT
  const showThreshold = viewportHeight * SHOW_THRESHOLD_PERCENT

  if (isScrollingDown && scrollY > hideThreshold && hiddenScrollRoom > hideThreshold) {
    return true
  } else if (!isScrollingDown && scrollY < showThreshold) {
    return false
  }

  return currentlyHidden
}

/** vdoc's own pages: its app bar above them and its footer below. The admin pages bring their own. */
export function SiteLayout() {
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
    const scrollRoom = (iframe?.contentDocument?.scrollingElement?.scrollHeight ?? 0) - viewportHeight
    // Only consulted while the navigation is shown, when hiding it would grow the frame by this much.
    const hiddenScrollRoom = scrollRoom - headerHeight - footerHeight

    setHideElements((currentHideState) => {
      return shouldHideNavigation(scrollY, isScrollingDown, currentHideState, viewportHeight, hiddenScrollRoom)
    })

    // Update scroll-to-top button visibility
    const shouldShowScrollToTop = scrollY > viewportHeight * 0.1
    setShowScrollToTop(shouldShowScrollToTop)

    lastScrollY.current = scrollY
  }, [scrollY, headerHeight, footerHeight])

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
      <ScrollToTop
        visible={showScrollToTop}
        onScrollToTop={handleScrollToTop}
        bottomOffset={hideElements ? 0 : footerHeight}
      />
    </Box>
  )
}

/** What every page shares: the theme and the color mode. The layout comes from the route below it. */
export function RootComponent() {
  const { brand } = route.useLoaderData()

  return (
    <ThemeProvider theme={brand.theme} defaultMode="system">
      <CssBaseline />
      <InitColorSchemeScript attribute={COLOR_SCHEME_ATTRIBUTE} />
      <IFrameScrollProvider>
        <ContentInsetProvider>
          <Outlet />
        </ContentInsetProvider>
      </IFrameScrollProvider>
    </ThemeProvider>
  )
}
