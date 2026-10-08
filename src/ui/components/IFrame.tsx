/**
 * This file is adapted from [docat] (https://github.com/docat-org/docat)
 * Licensed under the MIT License.
 */

import { useColorScheme } from '@mui/material'
import { useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useContentInset } from '@/contexts/ContentInsetContext'
import { useIFrameScroll } from '@/contexts/IFrameScrollContext'
import { DocumentationAddress, type FrameParams, toReadableHref } from '@/helpers/DocumentationAddress'
import { hookFramedDocument } from '@/helpers/FramedDocument'
import { FrameNavigator } from '@/helpers/FrameNavigator'
import { type IFrameHistoryMode, toggleDocumentationColorScheme, VDOC_THEME_ATTRIBUTE } from '@/helpers/IFrame'
import type { EffectiveColorMode } from '@/interfacesAndTypes/ColorModes'
import { testIDs } from '@/interfacesAndTypes/testIDs'

interface Props {
  src: DocumentationAddress
  /** The frame reached `href`, vdoc's readable address of the page. */
  onLocationChanged: (href: string) => void
  onTitleChanged: (title: string) => void
  onNotFound: () => void
  onHistoryModeChanged: (mode: IFrameHistoryMode) => void
}

export default function IFrame({ src, onLocationChanged, onTitleChanged, onNotFound, onHistoryModeChanged }: Props) {
  const { colorScheme, mode, systemMode } = useColorScheme()
  const { scrollY, setScrollY } = useIFrameScroll()
  const { contentInset } = useContentInset()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [frameNavigator] = useState(() => new FrameNavigator(() => iframeRef.current?.contentWindow))

  // MUI resolves `colorScheme` for us, but it is undefined until the color scheme has been
  // initialized, so fall back to the raw setting and resolve `system` here.
  const resolvedColorScheme = colorScheme ?? (mode === 'system' ? systemMode : mode)
  const effectiveColorMode: EffectiveColorMode = resolvedColorScheme === 'dark' ? 'dark' : 'light'

  // The handlers installed on the framed window outlive the render that installed them - they stay
  // attached for the lifetime of the framed document - so they read these through refs rather than
  // closing over a value that goes stale on the next render.
  const frameParams: FrameParams = { mode: effectiveColorMode, inset: contentInset ?? undefined }
  const frameParamsRef = useRef(frameParams)
  frameParamsRef.current = frameParams
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
   * Whether the frame has finished loading a document of its own. Until then the frame stays hidden
   * and vdoc's background shows through, because some browsers paint the empty frame white.
   */
  const [hasLoadedDocument, setHasLoadedDocument] = useState(false)

  /**
   * Bring the framed documentation to `requestedMode`.
   *
   * A frame that declares {@link VDOC_THEME_ATTRIBUTE} applies the mode itself, from the URL, so it
   * is asked by reloading with the parameter. A frame that does not (sphinx-awesome, doxygen) keeps
   * the legacy in-place class toggle, which is instant and must never turn into a reload.
   *
   * @returns whether a reload was started.
   */
  const applyColorMode = useCallback(
    (requestedMode: EffectiveColorMode): boolean => {
      const documentElement = iframeRef.current?.contentDocument?.documentElement
      if (!documentElement) {
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

      if (!frameNavigator.reload({ ...frameParamsRef.current, mode: requestedMode })) {
        return false
      }
      reloadedForModeRef.current = requestedMode
      restoreScrollYRef.current = scrollYRef.current
      return true
    },
    [frameNavigator]
  )

  // Update documentation's theme
  useEffect(() => {
    applyColorMode(effectiveColorMode)
  }, [effectiveColorMode, applyColorMode])

  /**
   * Tell vdoc's own interface where the frame currently is.
   *
   * Called for every document load, for every move within a document vdoc performs, and, through
   * the hooks installed on the framed document, for every navigation the frame performs on its own.
   */
  const report = (historyMode: IFrameHistoryMode): void => {
    const frameDocument = iframeRef.current?.contentDocument
    const address = frameDocument ? DocumentationAddress.parseFrame(frameDocument.location.href) : null
    if (frameDocument == null || address === null) {
      return
    }

    // Before `onLocationChanged`, which is what triggers the navigation that has to read the mode.
    onHistoryModeChanged(historyMode)

    // Without this the effect at the bottom of this component would take a client-side
    // navigation for a stale source and force-load the frame, throwing away the page the reader
    // just navigated to.
    frameNavigator.arrived(address)

    // A new page starts at the top, just like a document load does. A hash change does not:
    // jumping to the top is precisely the opposite of what the reader asked for.
    if (address.page !== reportedPageRef.current) {
      reportedPageRef.current = address.page
      setScrollY(0)
    }

    onLocationChanged(address.readableHref)
    reportedTitleRef.current = frameDocument.title
    onTitleChanged(reportedTitleRef.current)
  }

  const reportRef = useRef(report)
  reportRef.current = report

  /** Move the frame to `target`, through the one owner of every move. */
  const moveFrame = useCallback(
    (target: DocumentationAddress): void => {
      if (frameNavigator.navigate(target, frameParamsRef.current) === 'fragment') {
        // No document load reports this move, and `location.replace` added no session history entry
        // for it: like a document load, it is vdoc's to record.
        reportRef.current('push')
      }
    },
    [frameNavigator]
  )

  const onIframeLoad = (): void => {
    if (iframeRef.current === null) {
      console.error('iframeRef is null')
      return
    }

    // Apply dark mode. A participating frame may need a reload to do so, in which case the document
    // below is already on its way out and there is nothing worth reporting about it.
    if (applyColorMode(frameParamsRef.current.mode)) {
      return
    }
    if (iframeRef.current.contentDocument?.URL !== 'about:blank') {
      setHasLoadedDocument(true)
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

    const frameHref = iframeRef.current.contentDocument?.location.href
    if (frameHref == null || DocumentationAddress.parseFrame(frameHref) === null) {
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
        onNavigated: (historyMode: IFrameHistoryMode): void => reportRef.current(historyMode),

        onTitleChanged: (title: string): void => {
          if (title !== reportedTitleRef.current) {
            reportedTitleRef.current = title
            onTitleChanged(title)
          }
        },

        isAlreadyRecorded: (href: string): boolean => frameNavigator.expects(DocumentationAddress.parse(href)),

        displayHref: (href: string): string => toReadableHref(href),

        /**
         * A link leads out of the frame when it names no documentation page of vdoc's origin, or a
         * page of a different project than the one that is currently open.
         */
        leadsOutOfTheFrame: (href: string): boolean => DocumentationAddress.parse(href)?.project !== src.project,

        /**
         * The anchor carries the readable address, so this resolves the page out of it. A new
         * document is requested with the color mode - without the parameter it would not declare the
         * attribute, and the frame would drop out of the contract mid-navigation.
         */
        followInTheFrame: (href: string): void => {
          const target = DocumentationAddress.parse(href)
          if (target === null) {
            frameWindow.location.replace(href)
            return
          }
          moveFrame(target)
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
    reportRef.current('push')
  }

  // While a navigation is pending, the router state is transiently inconsistent:
  // the location already points at the target while the matched params still hold
  // the previous page, so `src` can be a mix of both. Syncing the iframe with such
  // a value force-loads the wrong document and bounces the iframe back to the
  // previous page (BUGS-7690). Only sync once the router has settled.
  const isNavigationPending = useRouterState({ select: (state) => state.status === 'pending' })
  // The frame reads the inset from its address once, so loading it before the header was measured
  // would leave it without one until the next navigation.
  const isInsetMeasured = contentInset !== null

  useEffect(() => {
    if (isNavigationPending || !isInsetMeasured) {
      return
    }
    // A client-side navigation in the frame reaches vdoc's router as well, and comes back here as a
    // new `src` for the page the frame already shows. Loading it again would undo that navigation.
    if (frameNavigator.expects(src)) {
      return
    }
    // The color mode is deliberately not a dependency of this effect - switching it must not reload
    // frames that apply it in place. `applyColorMode` reloads the ones that need it.
    moveFrame(src)
  }, [src, isNavigationPending, isInsetMeasured, frameNavigator, moveFrame])

  return (
    <iframe
      ref={iframeRef}
      data-testid={testIDs.project.documentation.documentationIframe}
      style={{ border: 0, width: '100%', height: '100%', visibility: hasLoadedDocument ? 'visible' : 'hidden' }}
      title="docs"
      onLoad={onIframeLoad}
    />
  )
}
