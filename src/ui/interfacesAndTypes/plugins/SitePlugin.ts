import type { PluginBaseT } from './PluginBase'

type SitePluginFields = {
  title: string | null
  description: string | null
  /** Markdown, one line per element */
  long_description: string[] | null
  show_on_landing_page: boolean
}

export type SitePluginT = PluginBaseT<SitePluginFields>

export default SitePluginT
