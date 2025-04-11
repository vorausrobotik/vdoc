import { Box, IconButton, AppBar, Toolbar, SelectChangeEvent, useTheme, Typography } from '@mui/material'
import { useState, useEffect, useMemo } from 'react'
import testIDs from './interfacesAndTypes/testIDs'
import { fetchProjectVersions, fetchProjectVersion, fetchLogoURL } from './helpers/APIFunctions'

import { useNavigate, useParams } from '@tanstack/react-router'
import VersionDropdown from './components/VersionDropdown'

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SettingsSidebar from './components/SettingsSidebar'
import { EffectiveColorMode } from './interfacesAndTypes/ColorModes'

export default function MenuBar() {
  const navigate = useNavigate({ from: '/$projectName/$version/$' })
  const params = useParams({ strict: false })
  const theme = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [projectName, setProjectName] = useState<string | undefined>(undefined)
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(null)
  const [projectVersions, setProjectVersions] = useState<string[] | undefined>(undefined)
  const [latestVersion, setLatestVersion] = useState<string | undefined>(undefined)
  useEffect(() => {
    const fetchData = async (mode: EffectiveColorMode): Promise<string | null> => {
      return await fetchLogoURL(mode)
    }
    fetchData(theme.palette.mode).then((url) => {
      setLogoUrl(url)
    })
  }, [theme])

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
    <AppBar
      position="static"
      data-testid={testIDs.header.main}
      sx={{
        background: theme.palette.mode === 'dark' ? 'transparent' : theme.palette.background.default,
      }}
      elevation={0}
    >
      <Toolbar>
        {/* Logo with Text */}
        {logoUrl !== undefined && (
          <Box
            sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flexGrow: 0, mr: 2, cursor: 'pointer' }}
            data-testid={testIDs.header.logo.main}
            component="a"
            href="/"
          >
            {logoUrl !== null ? (
              <img data-testid={testIDs.header.logo.image} src={logoUrl} alt="logo" style={{ maxHeight: 34 }} />
            ) : (
              <Typography
                data-testid={testIDs.header.logo.text}
                variant="h6"
                sx={{ color: theme.palette.text.primary }}
              >
                vdoc
              </Typography>
            )}
          </Box>
        )}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }} />

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
      </Toolbar>
      <SettingsSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
    </AppBar>
  )
}
