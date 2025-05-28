import { PluginBaseT } from './PluginBase'

type ThemeSettingsT = {
  logo_url?: string
  logo_url_small?: string
}

type ThemePluginFields = {
  light: ThemeSettingsT
  dark: ThemeSettingsT
}

export type ThemePluginT = PluginBaseT<ThemePluginFields>

export default ThemePluginT
