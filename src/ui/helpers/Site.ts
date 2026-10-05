import type SitePluginT from '@/interfacesAndTypes/plugins/SitePlugin'

/** Whether the landing page introduces the instance with its hero. */
export const showsHero = (config: SitePluginT | null): config is SitePluginT =>
  config?.active === true && config.show_on_landing_page
