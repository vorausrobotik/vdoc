import type { RefObject } from 'react'
import type { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'
import { FRAME_PATH_PREFIX, VDOC_FRAME_PARAMS, VDOC_THEME_PARAM } from './RouteHelpers'

export interface IFrameLocation {
  name: string
  version: string
  page: string
  search: URLSearchParams
  hash: string
  title: string
}

/**
 * How vdoc's own router should record a page change reported by the frame.
 *
 * `push` for document loads (the frame navigated with `location.replace` and added no session
 * history entry, so vdoc adds one), `replace` for client-side navigation (the frame already added
 * the entry itself, so vdoc must only correct the address of that entry).
 */
export type IFrameHistoryMode = 'push' | 'replace'
/**
 * Attribute a framed document sets on its `<html>` element to declare that it read
 * {@link VDOC_THEME_PARAM} and applied the requested mode itself. Its value is the mode it applied.
 *
 * Frames that do not set it are driven through {@link toggleDocumentationColorScheme} instead.
 * See `docs/frame_contract.md`.
 */
export const VDOC_THEME_ATTRIBUTE = 'data-vdoc-theme'

export function toggleDocumentationColorScheme(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  mode: EffectiveColorMode
) {
  const currentIFrame = iframeRef?.current
  const contentWindow = currentIFrame?.contentWindow
  const documentElement = currentIFrame?.contentDocument?.documentElement

  if (!currentIFrame || !contentWindow || !documentElement) {
    return
  }

  contentWindow.localStorage.setItem('darkMode', mode as 'light' | 'dark')
  // https://jothepro.github.io/doxygen-awesome-css/md_docs_tricks.html#tricks-darkmode
  const isDoxygen = documentElement?.getAttribute('xmlns') === 'http://www.w3.org/1999/xhtml'
  if (isDoxygen) {
    documentElement.classList.remove('light-mode', 'dark-mode')
    documentElement.classList.add(mode === 'dark' ? 'dark-mode' : 'light-mode')
  }
  // If not Doxygen, use the standard dark class (in our case sphinx awesome using tailwind)
  // https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
  else {
    documentElement.classList.toggle('dark', mode === 'dark')
  }
}

export function parseIFrameHref(iframeRef: RefObject<HTMLIFrameElement | null>): IFrameLocation | null {
  const iframeHref = iframeRef.current?.contentDocument?.location.href
  if (iframeHref == null) {
    return null
  }

  if (!iframeHref.includes(FRAME_PATH_PREFIX)) {
    return null
  }

  try {
    const url = new URL(iframeHref)

    // Extract path after the prefix
    const pathAfterPrefix = url.pathname.split(FRAME_PATH_PREFIX)[1]
    if (!pathAfterPrefix) {
      return null
    }

    // Split into: name/version/rest-of-path
    const pathParts = pathAfterPrefix.split('/')
    const [name, version, ...pageParts] = pathParts
    const page = pageParts.join('/')

    // Extract search as URLSearchParams object and hash without the '#' prefix.
    // vdoc's own parameters are requests to the frame, not part of the page's address: they must not
    // reach vdoc's address bar, or they would be appended a second time on the next compose.
    const search = new URLSearchParams(url.search)
    for (const param of VDOC_FRAME_PARAMS) {
      search.delete(param)
    }
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash

    return {
      name,
      version,
      page,
      search,
      hash,
      title: iframeRef.current?.contentDocument?.title ?? '',
    }
  } catch {
    console.error(`Unable to parse IFrame location ${iframeHref}`)
    return null
  }
}
