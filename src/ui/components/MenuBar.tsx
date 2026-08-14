import {
  AppBar,
  Box,
  Grid,
  type SelectChangeEvent,
  Slide,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { getRouteApi, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useContentInset } from '../contexts/ContentInsetContext'
import { fetchAppVersion, fetchPluginConfig, fetchProjectVersion, fetchProjectVersions } from '../helpers/APIFunctions'
import type OramaPluginT from '../interfacesAndTypes/plugins/OramaPluginT'
import testIDs from '../interfacesAndTypes/testIDs'
import ColorModeToggle from './ColorModeToggle'
import { OramaSearchPlugin } from './plugins/OramaSearchPlugin'
import VersionDropdown from './VersionDropdown'

const route = getRouteApi('__root__')

function LeftGroup() {
  const theme = useTheme()
  const useSmallLogo = useMediaQuery(theme.breakpoints.down('lg'))
  // Taken from the root loader, which resolves it before the first paint, rather than fetched here
  const { themePluginConfig } = route.useLoaderData()

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

function RightGroup() {
  const params = useParams({ strict: false })
  const navigate = useNavigate({ from: '/$projectName/$version/$' })

  const [projectVersions, setProjectVersions] = useState<string[] | undefined>(undefined)
  const [latestVersion, setLatestVersion] = useState<string | undefined>(undefined)
  const [appVersion, setAppVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchAppVersion().then((appVersion) => setAppVersion(appVersion))
  }, [])

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
      {/* Right of the version dropdown rather than left of it, because the dropdown is only there
          for a documentation: anything placed before it moves as soon as one is opened. */}
      <ColorModeToggle />
      {/* Stacked rather than written out on one line, so that naming the app costs no width next to
          the project version. The color goes through ``sx``, because the app bar hands its children
          the contrast text color and ``Typography``'s own ``color`` prop takes a palette name
          (``textSecondary``) rather than a path. */}
      <Box
        data-testid={testIDs.header.appVersion}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          color: 'text.secondary',
          lineHeight: 1.2,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }} noWrap>
          vdoc
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }} noWrap>
          {appVersion ?? 'N/A'}
        </Typography>
      </Box>
    </>
  )
}

export default function MenuBar({ hide = false }: { hide?: boolean }) {
  const theme = useTheme()

  const { setContentInset } = useContentInset()
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Report where vdoc's own header content starts, so the framed documentation can line its header
  // up with it. Measured rather than derived from the theme: the gutter is MUI's responsive
  // `Toolbar` default today, and a second copy of that rule would be a second thing to keep in step.
  // Observed rather than read once, because the gutter changes with the breakpoint.
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (toolbar === null) {
      return
    }
    const report = () => setContentInset(Number.parseFloat(window.getComputedStyle(toolbar).paddingLeft) || 0)
    report()
    const observer = new ResizeObserver(report)
    observer.observe(toolbar)
    return () => observer.disconnect()
  }, [setContentInset])

  return (
    <Slide appear={false} direction="down" in={!hide}>
      <AppBar
        position="fixed"
        data-testid={testIDs.header.main}
        sx={{
          background: theme.palette.background.default,
        }}
        elevation={0}
      >
        <Toolbar ref={toolbarRef}>
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
            {/* vdoc version, color mode toggle and the optional version dropdown */}
            <Grid id="appBarRightGroup" size={{ xs: 5, sm: 4, md: 3, lg: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                <RightGroup />
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </Slide>
  )
}
