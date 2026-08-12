/**
 * This file is adapted from [docat] (https://github.com/docat-org/docat)
 * Licensed under the MIT License.
 */

import { useColorScheme } from '@mui/material'
import { useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIFrameScroll } from '../contexts/IFrameScrollContext'
import { hookFramedDocument } from '../helpers/FramedDocument'
import { parseIFrameHref, toFrameHref, toggleDocumentationColorScheme, toReadableHref } from '../helpers/IFrame'
import { sanitizeDocuUri } from '../helpers/RouteHelpers'
import type { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'
import { testIDs } from '../interfacesAndTypes/testIDs'

interface Props {
  src: string
  onPageChanged: (page: string) => void
  onHashChanged: (hash: string) => void
  onSearchChanged: (search: URLSearchParams) => void
  onTitleChanged: (title: string) => void
  onNotFound: () => void
}

export default function IFrame({
  src,
  onPageChanged,
  onHashChanged,
  onSearchChanged,
  onTitleChanged,
  onNotFound,
}: Props) {
  const { colorScheme } = useColorScheme()
  const { setScrollY } = useIFrameScroll()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sourceRef = useRef<string | undefined>(null)
  const [contentWindow, setContentWindow] = useState<Window | null>()

  const currentProjectName = useMemo(() => sanitizeDocuUri(src).projectName, [src])

  const setDarkMode = useCallback((mode: EffectiveColorMode) => {
    toggleDocumentationColorScheme(iframeRef, mode)
  }, [])

  // Update documentation's theme
  useEffect(() => {
    setDarkMode(colorScheme as 'light' | 'dark')
  }, [colorScheme, setDarkMode])

  const onIframeLoad = (): void => {
    if (iframeRef.current === null) {
      console.error('iframeRef is null')
      return
    }

    // Cache current active content windows for other processes
    setContentWindow(iframeRef.current?.contentWindow)

    // Apply dark mode
    setDarkMode(colorScheme as 'light' | 'dark')

    // Set up scroll listener
    const contentWindow = iframeRef.current.contentWindow
    if (contentWindow) {
      // Reset scroll position when iframe loads
      setScrollY(0)

      const handleScroll = () => {
        const scrollY = contentWindow.document.documentElement.scrollTop || contentWindow.document.body.scrollTop
        setScrollY(scrollY)
      }
      contentWindow.addEventListener('scroll', handleScroll, { passive: true })
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
         * back out of it. `replace` rather than an assignment, so that the framed navigation adds
         * no session history entry - vdoc's own router adds one for the same navigation, and two
         * would make the back button need two clicks per page.
         * From here: https://www.ozzu.com/questions/358584/how-do-you-ignore-iframes-javascript-history
         */
        followInTheFrame: (href: string): void => {
          const frameHref = toFrameHref(href)
          sourceRef.current = frameHref
          frameWindow.location.replace(frameHref)
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

    onPageChanged(iframeLocation.page)
    onHashChanged(iframeLocation.hash)
    onSearchChanged(iframeLocation.search)
    onTitleChanged(iframeLocation.title ?? '')
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
    const srcWithOrigin = `${window.location.origin}${src}`
    if (sourceRef.current !== srcWithOrigin) {
      iframeRef.current?.contentWindow?.location.replace(srcWithOrigin)
      sourceRef.current = srcWithOrigin
    }
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
