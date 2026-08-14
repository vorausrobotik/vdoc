import { createRootRoute } from '@tanstack/react-router'

import { RootComponent } from '../components/RootLayout'
import { fetchPluginConfig } from '../helpers/APIFunctions'
import type ThemePluginT from '../interfacesAndTypes/plugins/ThemePlugin'

export const Route = createRootRoute({
  // Resolved before anything paints, because the palette decides how the whole interface looks and a
  // theme arriving afterwards would repaint it. This replaces the fetch the app bar used to do for its
  // logo, so it costs no additional request and the logo stops appearing a moment late as well.
  //
  // Caught: a theme that cannot be read leaves the framework's own defaults in place, which is worth
  // more than an interface that refuses to render.
  loader: async () => ({ themePluginConfig: await fetchPluginConfig<ThemePluginT>('theme').catch(() => null) }),
  component: RootComponent,
})
