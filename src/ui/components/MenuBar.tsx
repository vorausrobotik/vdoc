import { Box, BoxProps, IconButton, AppBar, Toolbar, SelectChangeEvent, useTheme, Typography } from '@mui/material'
import { useState, useEffect, useMemo } from 'react'
import testIDs from '../interfacesAndTypes/testIDs'
import ThemePluginT from '../interfacesAndTypes/plugins/ThemePlugin'
import { fetchProjectVersions, fetchProjectVersion, fetchAppVersion, fetchPluginConfig } from '../helpers/APIFunctions'

import { useNavigate, useParams } from '@tanstack/react-router'
import VersionDropdown from './VersionDropdown'

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SettingsSidebar from './SettingsSidebar'

function LeftGroup() {
  const theme = useTheme()
  const [themePluginConfig, setThemePluginConfig] = useState<ThemePluginT | null>(null)

  useEffect(() => {
    fetchPluginConfig<ThemePluginT>('theme').then((config) => setThemePluginConfig(config))
  }, [])

  const logoUrl = useMemo(() => {
    return themePluginConfig?.[theme.palette.mode]?.logo_url
  }, [themePluginConfig, theme.palette.mode])

  if (!logoUrl) {
    return null
  }

  return (
    <Box
      sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flexGrow: 0, mr: 2, cursor: 'pointer' }}
      data-testid={testIDs.header.logo.main}
      component="a"
      href="/"
    >
      {logoUrl !== null ? (
        <img data-testid={testIDs.header.logo.image} src={logoUrl} alt="logo" style={{ maxHeight: 34 }} />
      ) : (
        <Typography data-testid={testIDs.header.logo.text} variant="h6" sx={{ color: theme.palette.text.primary }}>
          vdoc
        </Typography>
      )}
    </Box>
  )
}

interface RightGroupPros extends BoxProps {
  setSidebarOpen: (open: boolean) => void
}

function RightGroup({ setSidebarOpen }: RightGroupPros) {
  const params = useParams({ strict: false })
  const navigate = useNavigate({ from: '/$projectName/$version/$' })

  const [projectName, setProjectName] = useState<string | undefined>(undefined)
  const [projectVersions, setProjectVersions] = useState<string[] | undefined>(undefined)
  const [latestVersion, setLatestVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchData = async (name: string): Promise<[string[], string]> => {
      return await Promise.all([fetchProjectVersions(name), fetchProjectVersion(name, 'latest')])
    }
    if (params.projectName) {
      fetchData(params.projectName).then(([versions, latestVersion]) => {
        setProjectName(params.projectName)
        setProjectVersions(versions)
        setLatestVersion(latestVersion)
      })
    } else {
      setProjectVersions(undefined)
      setLatestVersion(undefined)
    }
  }, [params, projectName])

  const handleVersionSelectChange = (event: SelectChangeEvent) => {
    const selectedVersion = event.target.value
    if (selectedVersion === 'all') {
      navigate({
        to: '/$projectName',
      })
    } else {
      navigate({
        to: `/$projectName/${selectedVersion}/$`,
      })
    }
  }

  const getSelectedVersion = useMemo(() => {
    let result
    if (params.version && projectVersions) {
      if (params.version !== 'latest' && !projectVersions?.includes(params.version)) {
        result = ''
      } else {
        result = params.version
      }
    } else {
      result = ''
    }

    return result
  }, [params.version, projectVersions])

  return (
    <>
      {projectVersions && latestVersion && params.version && (
        <Box sx={{ flexGrow: 0, display: { xs: 'flex' } }}>
          <VersionDropdown
            selectedVersion={getSelectedVersion}
            latestVersion={latestVersion}
            versions={projectVersions}
            onVersionChange={handleVersionSelectChange}
          />
        </Box>
      )}
      <IconButton
        data-testid={testIDs.header.settingsButton}
        aria-label="Open App Settings"
        onClick={() => setSidebarOpen(true)}
      >
        <SettingsOutlinedIcon />
      </IconButton>
    </>
  )
}

export default function MenuBar() {
  const theme = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [appVersion, setAppVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchAppVersion().then((appVersion) => setAppVersion(appVersion))
  }, [theme])

  return (
    <AppBar
      position="static"
      data-testid={testIDs.header.main}
      sx={{
        background: theme.palette.mode === 'dark' ? 'transparent' : theme.palette.background.default,
      }}
      elevation={0}
    >
      <Toolbar>
        {/* Logo and/or Text */}
        <LeftGroup />
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }} />
        {/* Optional version dropdown and settings button */}
        <RightGroup setSidebarOpen={setSidebarOpen} />
      </Toolbar>
      <SettingsSidebar open={sidebarOpen} setOpen={setSidebarOpen} appVersion={appVersion} />
    </AppBar>
  )
}
