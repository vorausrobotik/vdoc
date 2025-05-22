import { PluginBaseT } from './PluginBase'

type ThemeSettingsT = {
  logo_url?: string
}

type ThemePluginFields = {
  light: ThemeSettingsT
  dark: ThemeSettingsT
}

export type ThemePluginT = PluginBaseT<ThemePluginFields>

export default ThemePluginT
