import type { PluginBaseT } from './PluginBase'

type SitePluginFields = {
  title: string | null
  description: string | null
  show_on_landing_page: boolean
}

export type SitePluginT = PluginBaseT<SitePluginFields>

export default SitePluginT
