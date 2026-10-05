import { createRootRoute } from '@tanstack/react-router'
import { loadBrand } from '@/brands/Brand'
import { RootComponent } from '@/components/RootLayout'
import { fetchPluginConfig } from '@/helpers/APIFunctions'
import type SitePluginT from '@/interfacesAndTypes/plugins/SitePlugin'

export const Route = createRootRoute({
  // Resolved before anything paints, because the brand decides how the whole interface looks and a
  // brand arriving afterwards would repaint it. The landing page reads its banner from here as well.
  //
  // Caught: a site configuration that cannot be read leaves the default brand in place, which is worth
  // more than an interface that refuses to render.
  loader: async () => {
    const sitePluginConfig = await fetchPluginConfig<SitePluginT>('site').catch(() => null)
    return { sitePluginConfig, brand: await loadBrand(sitePluginConfig?.theme ?? 'default') }
  },
  component: RootComponent,
})
