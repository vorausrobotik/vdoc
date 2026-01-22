import { RefObject } from 'react'
import { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'

export interface IFrameLocation {
  name: string
  version: string
  page: string
  search: URLSearchParams
  hash: string
  title: string
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

export function parseIFrameHref(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  stripPrefix: string
): IFrameLocation | null {
  const iframeHref = iframeRef.current?.contentDocument?.location.href
  if (iframeHref == null) {
    return null
  }

  if (!iframeHref.includes(stripPrefix)) {
    return null
  }

  try {
    const url = new URL(iframeHref)

    // Extract path after the prefix
    const pathAfterPrefix = url.pathname.split(stripPrefix)[1]
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
