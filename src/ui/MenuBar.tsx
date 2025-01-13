import { Box, IconButton, AppBar, Toolbar, SelectChangeEvent, Typography } from '@mui/material'
import VDocLogo from './icons/VDocLogo'
import { useStore } from '@tanstack/react-store'
import globalStore from './helpers/GlobalStore'
import { useNavigate } from '@tanstack/react-router'
import VersionDropdown from './components/VersionDropdown'

export default function MenuBar() {
  const projectVersions = useStore(globalStore, (state) => state['projectVersions'])
  const currentVersion = useStore(globalStore, (state) => state['currentVersion'])
  const latestVersion = useStore(globalStore, (state) => state['latestVersion'])
  const navigate = useNavigate({ from: '/$projectName/$version/$' })

  const handleVersionSelectChange = (event: SelectChangeEvent) => {
    const selectedVersion = event.target.value
    if (selectedVersion === 'more') {
      navigate({
        to: '/$projectName',
      })
    } else {
      navigate({
        to: `/$projectName/${selectedVersion}/$`,
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
        {projectVersions && latestVersion && projectVersions && (
          <Box sx={{ flexGrow: 0, display: { xs: 'flex' } }}>
            <VersionDropdown
              selectedVersion={currentVersion ?? 'latest'}
              latestVersion={latestVersion}
              versions={projectVersions}
              onVersionChange={handleVersionSelectChange}
            />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
