import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {
  AppBar,
  Box,
  type BoxProps,
  Grid,
  IconButton,
  type SelectChangeEvent,
  Slide,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { fetchAppVersion, fetchPluginConfig, fetchProjectVersion, fetchProjectVersions } from '../helpers/APIFunctions'
import type OramaPluginT from '../interfacesAndTypes/plugins/OramaPluginT'
import type ThemePluginT from '../interfacesAndTypes/plugins/ThemePlugin'
import testIDs from '../interfacesAndTypes/testIDs'
import { OramaSearchPlugin } from './plugins/OramaSearchPlugin'
import SettingsSidebar from './SettingsSidebar'
import VersionDropdown from './VersionDropdown'

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
    }
    return largeLogoUrl ?? smallLogoUrl ?? null
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
    let result: string | undefined
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

export default function MenuBar({ hide = false }: { hide?: boolean }) {
  const theme = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [appVersion, setAppVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchAppVersion().then((appVersion) => setAppVersion(appVersion))
  }, [])

  return (
    <Slide appear={false} direction="down" in={!hide}>
      <AppBar
        position="fixed"
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <LeftGroup />
              </Box>
            </Grid>
            {/* Searchbar */}
            <Grid id="appBarMiddleGroup" size={{ xs: 6, sm: 7, md: 8, lg: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <MiddleGroup />
              </Box>
            </Grid>
            {/* Optional version dropdown and settings button */}
            <Grid id="appBarRightGroup" size={{ xs: 5, sm: 4, md: 3, lg: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <RightGroup setSidebarOpen={setSidebarOpen} />
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
        <SettingsSidebar open={sidebarOpen} setOpen={setSidebarOpen} appVersion={appVersion} />
      </AppBar>
    </Slide>
  )
}
