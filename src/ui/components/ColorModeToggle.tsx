import type { SvgIconComponent } from '@mui/icons-material'
import ContrastIcon from '@mui/icons-material/Contrast'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeIcon from '@mui/icons-material/LightMode'
import { IconButton, Tooltip } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'
import { type ColorMode, nextColorMode } from '../interfacesAndTypes/ColorModes'
import testIDs from '../interfacesAndTypes/testIDs'

const colorModeIcons: Record<ColorMode, SvgIconComponent> = {
  system: ContrastIcon,
  light: LightModeIcon,
  dark: DarkModeOutlinedIcon,
}

/**
 * A single button that cycles the color mode through system, light and dark.
 *
 * The icon names the mode that is currently in effect rather than the one the next press would
 * bring, so that the button reads as a display of the current setting.
 */
export default function ColorModeToggle() {
  const { mode, setMode } = useColorScheme()

  // Undefined until MUI has initialized the color scheme. Rendering nothing beats rendering a
  // button that names the wrong mode for a frame.
  if (!mode) {
    return null
  }

  const nextMode = nextColorMode(mode)
  const Icon = colorModeIcons[mode]
  const label = `Color mode: ${mode}. Switch to ${nextMode}.`

  return (
    <Tooltip title={label}>
      <IconButton
        data-testid={testIDs.header.colorModeToggle}
        // The mode is on the button itself, because the icon alone does not say which of the three
        // is active in a way anything outside the component can read.
        data-color-mode={mode}
        aria-label={label}
        onClick={() => setMode(nextMode)}
      >
        <Icon />
      </IconButton>
    </Tooltip>
  )
}
