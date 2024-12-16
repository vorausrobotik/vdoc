import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Box } from '@mui/material'
import VDocLogo from './icons/VDocLogo'
import { useStore } from '@tanstack/react-store'
import globalStore from './helpers/GlobalStore'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { useState } from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import { useNavigate } from '@tanstack/react-router'

export default function MenuBar() {
  const projectVersions = useStore(globalStore, (state) => state['projectVersions'])
  const currentVersion = useStore(globalStore, (state) => state['currentVersion'])
  const [versionDropdownValue, setVersionDropdownValue] = useState(currentVersion)
  const navigate = useNavigate({ from: '/$projectName/versions/$version' })

  const handleVersionSelectChange = (event: SelectChangeEvent) => {
    const selectedVersion = event.target.value
    setVersionDropdownValue(selectedVersion)
    navigate({
      to: `/$projectName/versions/${selectedVersion}`,
    })
  }

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Logo with Text */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flexGrow: 0, mr: 2 }}>
          <IconButton aria-label="delete" href={'/'}>
            <VDocLogo height={50} width={50} viewBox="0 0 100 100" />
          </IconButton>

          <Typography variant="h6" component="div">
            VDoc
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }} />

        {/* Dropdown Menu */}
        <Box sx={{ flexGrow: 0, display: { xs: projectVersions ? 'flex' : 'none' } }}>
          <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Version</InputLabel>
            <Select value={versionDropdownValue} onChange={handleVersionSelectChange} label="Version">
              <MenuItem key="latest" value="latest">
                latest
              </MenuItem>
              {projectVersions?.map((projectVersion) => (
                <MenuItem key={projectVersion} value={projectVersion}>
                  {projectVersion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
