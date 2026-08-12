/**
 * This file is adapted from [docat] (https://github.com/docat-org/docat)
 * Licensed under the MIT License.
 */

import { useColorScheme } from '@mui/material'
import { useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIFrameScroll } from '../contexts/IFrameScrollContext'
import { hookFramedDocument } from '../helpers/FramedDocument'
import {
  type IFrameHistoryMode,
  parseIFrameHref,
  toggleDocumentationColorScheme,
  VDOC_THEME_ATTRIBUTE,
} from '../helpers/IFrame'
import {
  composeIFrameSrc,
  normalizeIFrameSrc,
  sanitizeDocuUri,
  toFrameHref,
  toReadableHref,
} from '../helpers/RouteHelpers'
import type { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'
import { testIDs } from '../interfacesAndTypes/testIDs'

interface Props {
  src: string
  onPageChanged: (page: string) => void
  onHashChanged: (hash: string) => void
  onSearchChanged: (search: URLSearchParams) => void
  onTitleChanged: (title: string) => void
  onNotFound: () => void
  onHistoryModeChanged: (mode: IFrameHistoryMode) => void
}

export default function IFrame({
  src,
  onPageChanged,
  onHashChanged,
  onSearchChanged,
  onTitleChanged,
  onNotFound,
  onHistoryModeChanged,
}: Props) {
  const { colorScheme, mode, systemMode } = useColorScheme()
  const { scrollY, setScrollY } = useIFrameScroll()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sourceRef = useRef<string | undefined>(null)
  const [contentWindow, setContentWindow] = useState<Window | null>()

  const currentProjectName = useMemo(() => sanitizeDocuUri(src).projectName, [src])

  // MUI resolves `colorScheme` for us, but it is undefined until the color scheme has been
  // initialized, so fall back to the raw setting and resolve `system` here.
  const resolvedColorScheme = colorScheme ?? (mode === 'system' ? systemMode : mode)
  const effectiveColorMode: EffectiveColorMode = resolvedColorScheme === 'dark' ? 'dark' : 'light'

  // The handlers installed on the framed window outlive the render that installed them - they stay
  // attached for the lifetime of the framed document - so they read these through refs rather than
  // closing over a value that goes stale on the next render.
  const colorModeRef = useRef(effectiveColorMode)
  colorModeRef.current = effectiveColorMode
  const scrollYRef = useRef(scrollY)
  scrollYRef.current = scrollY

  /** Last page reported, so the scroll position is only reset when the page actually changed. */
  const reportedPageRef = useRef<string | null>(null)
  /** Last title reported, so a title arriving late is only forwarded when it is a change. */
  const reportedTitleRef = useRef<string | null>(null)
  /** Mode the frame was last reloaded for, so a frame that ignores the parameter cannot loop. */
  const reloadedForModeRef = useRef<EffectiveColorMode | null>(null)
  /** Scroll position to restore after a reload a color mode change triggered. */
  const restoreScrollYRef = useRef<number | null>(null)

  /**
   * Bring the framed documentation to `requestedMode`.
   *
   * A frame that declares {@link VDOC_THEME_ATTRIBUTE} applies the mode itself, from the URL, so it
   * is asked by reloading with the parameter. A frame that does not (sphinx-awesome, doxygen) keeps
   * the legacy in-place class toggle, which is instant and must never turn into a reload.
   *
   * @returns whether a reload was started.
   */
  const applyColorMode = useCallback((requestedMode: EffectiveColorMode): boolean => {
    const frameWindow = iframeRef.current?.contentWindow
    const documentElement = iframeRef.current?.contentDocument?.documentElement
    if (!frameWindow || !documentElement) {
      return false
    }

    const declaredMode = documentElement.getAttribute(VDOC_THEME_ATTRIBUTE)
    if (declaredMode === null) {
      toggleDocumentationColorScheme(iframeRef, requestedMode)
      return false
    }

    if (declaredMode === requestedMode) {
      // The frame already applied what is being asked for, so there is nothing to reload for.
      reloadedForModeRef.current = requestedMode
      return false
    }
    if (reloadedForModeRef.current === requestedMode) {
      // Already reloaded for this mode and the frame still declares another one. It sets the
      // attribute but does not honor the parameter; reloading again would only loop.
      return false
    }

    reloadedForModeRef.current = requestedMode
    restoreScrollYRef.current = scrollYRef.current
    const target = composeIFrameSrc(frameWindow.location.href, requestedMode)
    sourceRef.current = normalizeIFrameSrc(target)
    frameWindow.location.replace(target)
    return true
  }, [])

  // Update documentation's theme
  useEffect(() => {
    applyColorMode(effectiveColorMode)
  }, [effectiveColorMode, applyColorMode])

  const onIframeLoad = (): void => {
    if (iframeRef.current === null) {
      console.error('iframeRef is null')
      return
    }

    // Cache current active content windows for other processes
    setContentWindow(iframeRef.current?.contentWindow)

    // Apply dark mode. A participating frame may need a reload to do so, in which case the document
    // below is already on its way out and there is nothing worth reporting about it.
    if (applyColorMode(colorModeRef.current)) {
      return
    }

    // Set up scroll listener
    const contentWindow = iframeRef.current.contentWindow
    if (contentWindow) {
      // Reset scroll position when iframe loads, unless this load is the reload of the very same
      // page that a color mode change triggered - then the reader must stay where they were.
      const restoreScrollY = restoreScrollYRef.current
      restoreScrollYRef.current = null
      if (restoreScrollY !== null && restoreScrollY > 0) {
        contentWindow.scrollTo(0, restoreScrollY)
        // The framed document may still be laying out, in which case the scroll above is clamped to
        // a page that has not reached its full height yet. Re-apply once it has settled.
        contentWindow.requestAnimationFrame(() => contentWindow.scrollTo(0, restoreScrollY))
        setScrollY(restoreScrollY)
      } else {
        setScrollY(0)
      }

      const handleScroll = () => {
        const scrollY = contentWindow.document.documentElement.scrollTop || contentWindow.document.body.scrollTop
        setScrollY(scrollY)
      }
      contentWindow.addEventListener('scroll', handleScroll, { passive: true })
    }

    /**
     * Tell vdoc's own interface where the frame currently is.
     *
     * Called for every document load and, through the hooks installed below, for every navigation
     * the frame performs on its own.
     */
    const report = (historyMode: IFrameHistoryMode): void => {
      const frameLocation = parseIFrameHref(iframeRef)
      if (frameLocation == null) {
        return
      }

      // Before `onPageChanged`, which is what triggers the navigation that has to read the mode.
      onHistoryModeChanged(historyMode)

      const frameHref = iframeRef.current?.contentWindow?.location.href
      if (frameHref != null) {
        // Keep the source in sync with where the frame actually is. Without this the effect at the
        // bottom of this component would see a stale source after a client-side navigation and
        // force-load the frame, throwing away the page the reader just navigated to.
        sourceRef.current = normalizeIFrameSrc(frameHref)
      }

      // A new page starts at the top, just like a document load does. A hash change does not:
      // jumping to the top is precisely the opposite of what the reader asked for.
      if (frameLocation.page !== reportedPageRef.current) {
        reportedPageRef.current = frameLocation.page
        setScrollY(0)
      }

      onPageChanged(frameLocation.page)
      onHashChanged(frameLocation.hash)
      onSearchChanged(frameLocation.search)
      reportedTitleRef.current = frameLocation.title ?? ''
      onTitleChanged(reportedTitleRef.current)
    }

    const iframeLocation = parseIFrameHref(iframeRef)
    if (iframeLocation == null) {
      console.warn('IFrame onload event triggered, but url is null')
      return
    }

    // React to page 404ing
    if (iframeRef.current.contentDocument?.body.innerText === '{"detail":"Not Found"}') {
      onNotFound()
    }

    const frameWindow = iframeRef.current.contentWindow
    if (frameWindow != null) {
      hookFramedDocument(frameWindow, {
        onNavigated: report,

        onTitleChanged: (title: string): void => {
          if (title !== reportedTitleRef.current) {
            reportedTitleRef.current = title
            onTitleChanged(title)
          }
        },

        isAlreadyRecorded: (href: string): boolean => normalizeIFrameSrc(href) === sourceRef.current,

        displayHref: (href: string): string => toReadableHref(href),

        /**
         * A link leads out of the frame when its origin differs, or when it leads to a different
         * project's documentation than the one that is currently open.
         */
        leadsOutOfTheFrame: (href: string): boolean => {
          if (!href.startsWith(window.location.origin)) {
            return true
          }
          let linkProjectName: string | undefined
          // The href might be external or something else. The function is allowed to fail at this point.
          /* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
          try {
            linkProjectName = sanitizeDocuUri(href).projectName
          } catch {}
          return linkProjectName !== currentProjectName
        },

        /**
         * The anchor carries the readable address, so this resolves the one that reaches the file
         * back out of it, and requests the color mode along with it - without the parameter the new
         * document would not declare the attribute, and the frame would drop out of the contract
         * mid-navigation. `replace` rather than an assignment, so that the framed navigation adds no
         * session history entry - vdoc's own router adds one for the same navigation, and two would
         * make the back button need two clicks per page.
         * From here: https://www.ozzu.com/questions/358584/how-do-you-ignore-iframes-javascript-history
         */
        followInTheFrame: (href: string): void => {
          const frameHref = toFrameHref(href)
          sourceRef.current = normalizeIFrameSrc(frameHref)
          frameWindow.location.replace(composeIFrameSrc(frameHref, colorModeRef.current))
        },

        /**
         * Another project's documentation belongs inside vdoc's own interface rather than bare, so
         * open the readable address for it. Resolved again rather than taken as it is, because an
         * anchor rendered after the document loaded never had its address rewritten.
         */
        followOutsideTheFrame: (href: string): void => {
          window.open(toReadableHref(href), '_blank', 'noopener')
        },
      })
    }

    // A document load means the frame got here through `location.replace`, which adds no session
    // history entry of its own: this navigation is vdoc's to record.
    report('push')
  }

  const hashChangeEventListener = useCallback((): void => {
    if (iframeRef.current === null) {
      console.error('hashChangeEvent from iframe but iframeRef is null')
      return
    }

    const url = iframeRef.current?.contentDocument?.location.href
    if (url == null) {
      return
    }

    let hash = url.split('#')[1]
    if (hash === null) {
      hash = ''
    }

    onHashChanged(hash)
  }, [onHashChanged])

  const titleChangeEventListener = useCallback((): void => {
    if (iframeRef.current === null) {
      console.error('titleChangeEvent from iframe but iframeRef is null')
      return
    }

    const title = iframeRef.current?.contentDocument?.title
    if (title == null) {
      return
    }

    onTitleChanged(title)
  }, [onTitleChanged])

  useEffect(() => {
    if (!contentWindow) {
      return
    }

    contentWindow.addEventListener('hashchange', hashChangeEventListener)
    contentWindow.addEventListener('titlechange', titleChangeEventListener)

    return () => {
      contentWindow.removeEventListener('hashchange', hashChangeEventListener)
      contentWindow.removeEventListener('titlechange', titleChangeEventListener)
    }
  }, [contentWindow, titleChangeEventListener, hashChangeEventListener])

  // While a navigation is pending, the router state is transiently inconsistent:
  // the location already points at the target while the matched params still hold
  // the previous page, so `src` can be a mix of both. Syncing the iframe with such
  // a value force-loads the wrong document and bounces the iframe back to the
  // previous page (BUGS-7690). Only sync once the router has settled.
  const isNavigationPending = useRouterState({ select: (state) => state.status === 'pending' })

  useEffect(() => {
    if (isNavigationPending) {
      return
    }
    // Compared through `normalizeIFrameSrc`, the same way `report()` records where the frame is:
    // if the two composed the address differently, every client-side navigation would look like a
    // stale source here and be force-loaded away.
    const normalizedSrc = normalizeIFrameSrc(src)
    if (sourceRef.current === normalizedSrc) {
      return
    }
    sourceRef.current = normalizedSrc
    // Requested with the address exactly as vdoc's router holds it, not with the normalized one:
    // what may be ignored when comparing two addresses must still be requested faithfully. The
    // color mode is deliberately not a dependency of this effect - switching it must not reload
    // frames that apply it in place. `applyColorMode` reloads the ones that need it.
    iframeRef.current?.contentWindow?.location.replace(
      composeIFrameSrc(`${window.location.origin}${src}`, colorModeRef.current)
    )
  }, [src, isNavigationPending])

  return (
    <iframe
      ref={iframeRef}
      data-testid={testIDs.project.documentation.documentationIframe}
      style={{ border: 0, width: '100%', height: '100%' }}
      title="docs"
      onLoad={onIframeLoad}
    />
  )
}
