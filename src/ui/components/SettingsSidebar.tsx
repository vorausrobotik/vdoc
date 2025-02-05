import * as React from 'react'
import { styled, useColorScheme } from '@mui/material/styles'
import Drawer from '@mui/material/Drawer'
import { ColorMode } from '../interfacesAndTypes/ColorModes'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import testIDs from '../interfacesAndTypes/testIDs'

const Heading = styled(Typography)(({ theme }) => ({
  margin: '16px 0 8px',
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: theme.typography.pxToRem(12),
  textTransform: 'uppercase',
  letterSpacing: '.1rem',
  color: theme.palette.text.primary,
}))

const IconToggleButton = styled(ToggleButton)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  '& > *': {
    marginRight: '8px',
  },
})

interface SettingsSidebarProps extends React.ComponentProps<'div'> {
  open: boolean
  setOpen: (newOpen: boolean) => void
}

export default function SettingsSidebar(props: SettingsSidebarProps) {
  const { mode, setMode } = useColorScheme()

  const handleColorModeChange = (_: React.MouseEvent<HTMLElement>, paletteMode: ColorMode | null) => {
    if (paletteMode === null) {
      return
    }
    setMode(paletteMode)
  }

  return (
    <Drawer
      data-testid={testIDs.sidebar.main}
      anchor="right"
      onClose={() => props.setOpen(false)}
      open={props.open}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '10px 0px 0px 10px',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
        }}
      >
        <Typography>Settings</Typography>
        <IconButton
          onClick={() => props.setOpen(false)}
          edge="end"
          aria-label="close"
          data-testid={testIDs.sidebar.close}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ pl: 2, pr: 2 }}>
        <Heading id="settings-mode">Color Mode</Heading>
        <ToggleButtonGroup
          exclusive
          value={mode}
          color="primary"
          onChange={handleColorModeChange}
          aria-labelledby="settings-mode"
          fullWidth
          data-testid={testIDs.sidebar.settings.toggleColorModes.main}
        >
          <IconToggleButton
            value="light"
            aria-label="light"
            data-testid={testIDs.sidebar.settings.toggleColorModes.buttons.light}
          >
            <LightModeIcon fontSize="small" />
            Light
          </IconToggleButton>
          <IconToggleButton
            value="system"
            aria-label="system"
            data-testid={testIDs.sidebar.settings.toggleColorModes.buttons.system}
          >
            <SettingsBrightnessIcon fontSize="small" />
            System
          </IconToggleButton>
          <IconToggleButton
            value="dark"
            aria-label="dark"
            data-testid={testIDs.sidebar.settings.toggleColorModes.buttons.dark}
          >
            <DarkModeOutlinedIcon fontSize="small" />
            Dark
          </IconToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Drawer>
  )
}
