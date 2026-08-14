import type { PluginBaseT } from './PluginBase'

type ThemePaletteT = {
  primary?: string | null
  divider?: string | null
  background_default?: string | null
  background_paper?: string | null
}

type ThemeSettingsT = {
  logo_url?: string
  logo_url_small?: string
  palette?: ThemePaletteT
}

type ThemePluginFields = {
  light: ThemeSettingsT
  dark: ThemeSettingsT
  border_radius: number | null
  flat_cards: boolean
}

export type ThemePluginT = PluginBaseT<ThemePluginFields>

export default ThemePluginT
