import {
  Box,
  BoxProps,
  Grid,
  IconButton,
  AppBar,
  Toolbar,
  SelectChangeEvent,
  useTheme,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useState, useEffect, useMemo } from 'react'
import testIDs from '../interfacesAndTypes/testIDs'
import ThemePluginT from '../interfacesAndTypes/plugins/ThemePlugin'
import { fetchProjectVersions, fetchProjectVersion, fetchAppVersion, fetchPluginConfig } from '../helpers/APIFunctions'

import { useNavigate, useParams } from '@tanstack/react-router'
import VersionDropdown from './VersionDropdown'

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SettingsSidebar from './SettingsSidebar'
import OramaSearchPlugin from './plugins/OramaSearchPlugin'
import OramaPluginT from '../interfacesAndTypes/plugins/OramaPluginT'

function LeftGroup() {
  const theme = useTheme()
  const useSmallLogo = useMediaQuery(theme.breakpoints.down('lg'))
  const [themePluginConfig, setThemePluginConfig] = useState<ThemePluginT | null>(null)

  useEffect(() => {
    fetchPluginConfig<ThemePluginT>('theme').then((config) => setThemePluginConfig(config))
  }, [])

  const logoUrl = useMemo(() => {
    const smallLogoUrl = themePluginConfig?.[theme.palette.mode]?.logo_url_small
    const largeLogoUrl = themePluginConfig?.[theme.palette.mode]?.logo_url

    if (useSmallLogo && smallLogoUrl) {
      return smallLogoUrl
    } else {
      return largeLogoUrl ?? smallLogoUrl ?? null
    }

    return null
  }, [themePluginConfig, useSmallLogo, theme.palette.mode])

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', flexGrow: 0, mr: 2, cursor: 'pointer' }}
      data-testid={testIDs.header.logo.main}
      component="a"
      href="/"
    >
      {logoUrl ? (
        <img data-testid={testIDs.header.logo.image} src={logoUrl} alt="logo" style={{ maxHeight: 34 }} />
      ) : (
        <Typography data-testid={testIDs.header.logo.text} variant="h6" sx={{ color: theme.palette.text.primary }}>
          vdoc
        </Typography>
      )}
    </Box>
  )
}

function MiddleGroup() {
  const [oramaPluginConfig, setOramaPluginConfig] = useState<OramaPluginT | null>(null)

  useEffect(() => {
    fetchPluginConfig<OramaPluginT>('orama').then((config) => setOramaPluginConfig(config))
  }, [])

  if (!oramaPluginConfig?.active) {
    return null
  }
  return <OramaSearchPlugin {...oramaPluginConfig} />
}

interface RightGroupPros extends BoxProps {
  setSidebarOpen: (open: boolean) => void
}

function RightGroup({ setSidebarOpen }: RightGroupPros) {
  const params = useParams({ strict: false })
  const navigate = useNavigate({ from: '/$projectName/$version/$' })

  const [projectVersions, setProjectVersions] = useState<string[] | undefined>(undefined)
  const [latestVersion, setLatestVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchData = async (name: string): Promise<[string[], string]> => {
      return await Promise.all([fetchProjectVersions(name), fetchProjectVersion(name, 'latest')])
    }
    if (params.projectName) {
      fetchData(params.projectName).then(([versions, latestVersion]) => {
        setProjectVersions(versions)
        setLatestVersion(latestVersion)
      })
    }
  }, [params.projectName])

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
      <Box>
        {projectVersions && latestVersion && params.projectName && params.version && (
          <VersionDropdown
            selectedVersion={getSelectedVersion}
            latestVersion={latestVersion}
            versions={projectVersions}
            onVersionChange={handleVersionSelectChange}
          />
        )}
      </Box>
      <Box>
        <IconButton
          data-testid={testIDs.header.settingsButton}
          aria-label="Open App Settings"
          onClick={() => setSidebarOpen(true)}
        >
          <SettingsOutlinedIcon />
        </IconButton>
      </Box>
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
        <Grid
          container
          spacing={1}
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          wrap="nowrap"
        >
          {/* Logo and/or Text */}
          <Grid id="appBarLeftGroup" size={{ xs: 1, sm: 1, md: 1, lg: 3 }}>
            <Box display="flex" justifyContent="flex-start">
              <LeftGroup />
            </Box>
          </Grid>
          {/* Searchbar */}
          <Grid id="appBarMiddleGroup" size={{ xs: 6, sm: 7, md: 8, lg: 6 }}>
            <Box display="flex" justifyContent="center">
              <MiddleGroup />
            </Box>
          </Grid>
          {/* Optional version dropdown and settings button */}
          <Grid id="appBarRightGroup" size={{ xs: 5, sm: 4, md: 3, lg: 3 }}>
            <Box display="flex" justifyContent="flex-end">
              <RightGroup setSidebarOpen={setSidebarOpen} />
            </Box>
          </Grid>
        </Grid>
      </Toolbar>
      <SettingsSidebar open={sidebarOpen} setOpen={setSidebarOpen} appVersion={appVersion} />
    </AppBar>
  )
}
