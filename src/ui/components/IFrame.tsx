/**
 * This file is adapted from [docat] (https://github.com/docat-org/docat)
 * Licensed under the MIT License.
 */

import { testIDs } from '../interfacesAndTypes/testIDs'
import { useColorScheme } from '@mui/material'
import { useRef, useEffect, useCallback, useState } from 'react'

interface Props {
  src: string
  onPageChanged: (page: string, hash: string, title?: string) => void
  onHashChanged: (hash: string) => void
  onTitleChanged: (title: string) => void
  onNotFound: () => void
}

export default function IFrame({ src, onPageChanged, onHashChanged, onTitleChanged, onNotFound }: Props) {
  const { colorScheme } = useColorScheme()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sourceRef = useRef<string | undefined>(null)
  const [contentWindow, setContentWindow] = useState<Window | null>()
  const stripPrefix = '/static/projects/'

  const setDarkMode = useCallback((mode: 'dark' | 'light') => {
    iframeRef?.current?.contentWindow?.localStorage.setItem('darkMode', mode as 'light' | 'dark')
    if (mode === 'dark') {
      iframeRef?.current?.contentDocument?.documentElement?.classList.toggle('dark', true)
    } else {
      iframeRef?.current?.contentDocument?.documentElement?.classList.toggle('dark', false)
    }
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

    const url = iframeRef.current?.contentDocument?.location.href
    if (url == null) {
      console.warn('IFrame onload event triggered, but url is null')
      return
    }

    // React to page 404ing
    if (iframeRef.current.contentDocument?.body.innerText === '{"detail":"Not Found"}') {
      onNotFound()
    }

    // Make all external links in iframe open in new tab and make internal links replace the iframe url so that change
    // doesn't show up in the page history (we'd need to click back twice)
    iframeRef.current.contentDocument?.querySelectorAll('a').forEach((anchor: HTMLAnchorElement) => {
      if (!anchor.href.startsWith(window.location.origin)) {
        anchor.setAttribute('target', '_blank')
        return
      }

      const href = anchor.getAttribute('href') ?? ''
      if (href.trim() === '') {
        // Ignore empty links, may be handled with js internally.
        // Will inevitably cause the user to have to click back multiple times to get back to the previous page.
        return
      }

      // Backup original href for onclick event
      const originalLink = anchor.href
      // Strip iframe prefix from the href for display/copy events
      anchor.href = new URL(anchor.href, iframeRef.current?.contentDocument?.baseURI).href.replace(stripPrefix, '/')

      // Links that are to be opened in new tabs should still be opened in new tabs
      if (anchor.target === '_blank') {
        return
      }

      // From here: https://www.ozzu.com/questions/358584/how-do-you-ignore-iframes-javascript-history
      anchor.onclick = () => {
        iframeRef.current?.contentWindow?.location.replace(originalLink)
        sourceRef.current = originalLink
        return false
      }
    })

    const parts = url.split(stripPrefix).slice(1).join(stripPrefix).split('/')
    const urlPageAndHash = parts.slice(2).join('/')
    const hashIndex = urlPageAndHash.includes('#') ? urlPageAndHash.indexOf('#') : urlPageAndHash.length
    const urlPage = urlPageAndHash.slice(0, hashIndex)
    const urlHash = urlPageAndHash.slice(hashIndex)
    const title = iframeRef.current?.contentDocument?.title
    onPageChanged(urlPage, urlHash, title)
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

  useEffect(() => {
    const srcWithOrigin = `${window.location.origin}${src}`
    if (sourceRef.current !== srcWithOrigin) {
      iframeRef.current?.contentWindow?.location.replace(srcWithOrigin)
      sourceRef.current = srcWithOrigin
    }
  }, [src])

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
