import { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'

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
