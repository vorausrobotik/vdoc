import { RefObject } from 'react'
import { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'

export interface IFrameLocation {
  name: string
  version: string
  page: string
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
    const parts = iframeHref.split(stripPrefix).slice(1).join(stripPrefix).split('/')
    const urlPageAndHash = parts.slice(2).join('/')
    const hashIndex = urlPageAndHash.includes('#') ? urlPageAndHash.indexOf('#') : urlPageAndHash.length

    return {
      name: parts[0],
      version: parts[1],
      page: urlPageAndHash.slice(0, hashIndex),
      hash: urlPageAndHash.slice(hashIndex + 1), // +1 to skip the '#' character
      title: iframeRef.current?.contentDocument?.title ?? '',
    }
  } catch {
    console.error(`Unable to parse IFrame location ${iframeHref}`)
    return null
  }
}
