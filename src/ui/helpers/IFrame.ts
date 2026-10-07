import type { EffectiveColorMode } from '@/interfacesAndTypes/ColorModes'
import { VDOC_THEME_PARAM } from './DocumentationAddress'

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
 * See `docs/docs/06-frame-contract.md`.
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
