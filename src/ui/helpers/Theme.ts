import { createTheme, type PaletteOptions, type Theme } from '@mui/material/styles'
import type { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'
import type ThemePluginT from '../interfacesAndTypes/plugins/ThemePlugin'

/**
 * Turns the theme plugin's configuration into a MUI theme.
 *
 * The one place that translates configuration into appearance. A value the plugin leaves unset is left
 * out of the options entirely rather than passed as undefined, so MUI keeps its own default for it and
 * an unconfigured instance looks exactly as it did before the plugin could say anything.
 *
 * Supporting another palette value is a field on the plugin and one line in `paletteFor` below.
 */
export function buildTheme(config: ThemePluginT | null): Theme {
  return createTheme({
    colorSchemes: {
      light: { palette: paletteFor(config, 'light') },
      dark: { palette: paletteFor(config, 'dark') },
    },
    ...(config?.border_radius != null && { shape: { borderRadius: config.border_radius } }),
    ...(config?.flat_cards && {
      // "No shadow, square, one pixel of border" is what MUI's outlined variant already is
      components: { MuiCard: { defaultProps: { variant: 'outlined' as const } } },
    }),
  })
}

function paletteFor(config: ThemePluginT | null, mode: EffectiveColorMode): PaletteOptions {
  const palette = config?.[mode]?.palette

  return {
    ...(palette?.primary && { primary: { main: palette.primary } }),
    ...(palette?.divider && { divider: palette.divider }),
    ...((palette?.background_default || palette?.background_paper) && {
      background: {
        ...(palette.background_default && { default: palette.background_default }),
        ...(palette.background_paper && { paper: palette.background_paper }),
      },
    }),
  }
}
