import type { RefObject } from 'react'
import type { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'

export interface IFrameLocation {
  name: string
  version: string
  page: string
  search: URLSearchParams
  hash: string
  title: string
}

/**
 * Path prefix under which vdoc serves the published documentation files themselves.
 *
 * The files need a namespace of their own because relative links inside a framed page resolve
 * against the page's own address: without the prefix, a click inside the frame would load vdoc's
 * application into the frame instead of the next documentation page.
 */
export const FRAME_PATH_PREFIX = '/static/projects/'

/**
 * The readable form of `href`: the address vdoc's own router answers for the same page.
 *
 * The same page has two addresses - the file under {@link FRAME_PATH_PREFIX} and vdoc's own
 * `/{project}/{version}/...` - and mapping between them is a pure function in both directions,
 * with {@link toFrameHref} as the inverse. Nothing has to be remembered per link.
 *
 * Foreign addresses are returned verbatim, addresses of vdoc's own origin absolute, and applying
 * this to an address that is already readable changes nothing.
 *
 * @param href The address to convert, absolute or relative to `origin`.
 * @param origin The origin vdoc is served from.
 */
export function toReadableHref(href: string, origin: string = window.location.origin): string {
  const url = new URL(href, origin)
  if (url.origin !== origin) {
    return href
  }
  if (url.pathname.startsWith(FRAME_PATH_PREFIX)) {
    url.pathname = `/${url.pathname.slice(FRAME_PATH_PREFIX.length)}`
  }
  return url.href
}

/**
 * The frame form of `href`: the address that reaches the documentation file itself.
 *
 * The inverse of {@link toReadableHref}, and idempotent for the same reason: this runs while a
 * click is being handled, and what the anchor carries at that moment is not certain. A framework
 * that re-renders a link restores the address the documentation authored, so the same link can
 * arrive in either form and must end up at the same file either way.
 *
 * @param href The address to convert, absolute or relative to `origin`.
 * @param origin The origin vdoc is served from.
 */
export function toFrameHref(href: string, origin: string = window.location.origin): string {
  const url = new URL(href, origin)
  if (url.origin !== origin) {
    return href
  }
  if (!url.pathname.startsWith(FRAME_PATH_PREFIX)) {
    url.pathname = `${FRAME_PATH_PREFIX}${url.pathname.replace(/^\//, '')}`
  }
  return url.href
}

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

    // Extract search as URLSearchParams object and hash without the '#' prefix
    const search = new URLSearchParams(url.search)
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
