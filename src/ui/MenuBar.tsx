import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Box } from '@mui/material'
import VDocLogo from './icons/VDocLogo'
import { useStore } from '@tanstack/react-store'
import globalStore from './helpers/GlobalStore'
import { SelectChangeEvent } from '@mui/material/Select'
import IconButton from '@mui/material/IconButton'
import { useNavigate } from '@tanstack/react-router'
import VersionDropdown from './components/VersionDropdown'

export default function MenuBar() {
  const projectVersions = useStore(globalStore, (state) => state['projectVersions'])
  const currentVersion = useStore(globalStore, (state) => state['currentVersion'])
  const navigate = useNavigate({ from: '/projects/$projectName/versions/$version' })

  const handleVersionSelectChange = (event: SelectChangeEvent) => {
    const selectedVersion = event.target.value
    if (selectedVersion === 'more') {
      navigate({
        to: `/projects/$projectName/versions`,
      })
    } else {
      navigate({
        to: `/projects/$projectName/versions/${selectedVersion}`,
      })
    }
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

        {/* Version Dropdown Menu */}
        <Box sx={{ flexGrow: 0, display: { xs: projectVersions ? 'flex' : 'none' } }}>
          <VersionDropdown
            selectedVersion={currentVersion ?? 'latest'}
            versions={projectVersions}
            onVersionChange={handleVersionSelectChange}
          />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
