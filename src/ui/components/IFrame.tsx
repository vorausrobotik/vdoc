/**
 * This file is adapted from [docat] (https://github.com/docat-org/docat)
 * Licensed under the MIT License.
 */

import { testIDs } from '../interfacesAndTypes/testIDs'
import axios from 'axios'
import { useColorScheme } from '@mui/material'
import { useState, useRef, useEffect } from 'react'

interface Props {
  src: string
  onPageChanged: (page: string, hash: string, title?: string) => void
  onHashChanged: (hash: string) => void
  onTitleChanged: (title: string) => void
  onNotFound: () => void
}

export default function IFrame(props: Props) {
  const { colorScheme } = useColorScheme()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const setDarkMode = (mode: "dark" | "light") => {
    iframeRef?.current?.contentWindow?.localStorage.setItem('darkMode', colorScheme as 'light' | 'dark')
    if (mode === "dark") {
      iframeRef?.current?.contentDocument?.documentElement?.classList.toggle("dark", true);
    } else {
      iframeRef?.current?.contentDocument?.documentElement?.classList.toggle("dark", false);
    }
  }

  // Update documentation's theme
  useEffect(() => {
    setDarkMode(colorScheme as 'light' | 'dark')
  }, [colorScheme])

  const onIframeLoad = (): void => {
    if (iframeRef.current === null) {
      console.error('iframeRef is null')
      return
    }

    // Apply dark mode
    setDarkMode(colorScheme as 'light' | 'dark')

    // Remove the event listeners to prevent memory leaks
    iframeRef.current.contentWindow?.removeEventListener('hashchange', hashChangeEventListener)
    iframeRef.current.contentWindow?.removeEventListener('titlechange', titleChangeEventListener)

    const url = iframeRef.current?.contentDocument?.location.href
    if (url == null) {
      console.warn('IFrame onload event triggered, but url is null')
      return
    }

    // Make all external links in iframe open in new tab and make internal links replace the iframe url so that change
    // doesn't show up in the page history (we'd need to click back twice)
    iframeRef.current.contentDocument?.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
      if (!a.href.startsWith(window.location.origin)) {
        a.setAttribute('target', '_blank')
        return
      }

      const href = a.getAttribute('href') ?? ''
      if (href.trim() === '') {
        // Ignore empty links, may be handled with js internally.
        // Will inevitably cause the user to have to click back multiple times to get back to the previous page.
        return
      }

      // From here: https://www.ozzu.com/questions/358584/how-do-you-ignore-iframes-javascript-history
      a.onclick = () => {
        iframeRef.current?.contentWindow?.location.replace(a.href)
        return false
      }
    })

    // React to page 404ing
    void (async (): Promise<void> => {
      await axios.head(url).catch(() => {
        props.onNotFound()
      })
    })()

    // Add the event listeners again
    iframeRef.current.contentWindow?.addEventListener('hashchange', hashChangeEventListener)
    iframeRef.current.contentWindow?.addEventListener('titlechange', titleChangeEventListener)

    const delimiter = '/static/projects/'
    const parts = url.split(delimiter).slice(1).join(delimiter).split('/')
    const urlPageAndHash = parts.slice(2).join('/')
    const hashIndex = urlPageAndHash.includes('#') ? urlPageAndHash.indexOf('#') : urlPageAndHash.length
    const urlPage = urlPageAndHash.slice(0, hashIndex)
    const urlHash = urlPageAndHash.slice(hashIndex)
    const title = iframeRef.current?.contentDocument?.title
    props.onPageChanged(urlPage, urlHash, title)
  }

  const hashChangeEventListener = (): void => {
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

    props.onHashChanged(hash)
  }

  const titleChangeEventListener = (): void => {
    if (iframeRef.current === null) {
      console.error('titleChangeEvent from iframe but iframeRef is null')
      return
    }

    const title = iframeRef.current?.contentDocument?.title
    if (title == null) {
      return
    }

    props.onTitleChanged(title)
  }


  return (
    <iframe
      ref={iframeRef}
      data-testid={testIDs.project.documentation.documentationIframe}
      style={{ border: 0, width: '100%', height: '100%' }}
      src={props.src}
      title="docs"
      onLoad={onIframeLoad}
    />
  )
}
