import { Box, type SelectChangeEvent, Slide, useTheme } from '@mui/material'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBrand } from '@/brands/Brand'
import { useContentInset } from '@/contexts/ContentInsetContext'
import { fetchPluginConfig, fetchProjectVersion, fetchProjectVersions } from '@/helpers/APIFunctions'
import type OramaPluginT from '@/interfacesAndTypes/plugins/OramaPluginT'
import testIDs from '@/interfacesAndTypes/testIDs'
import ColorModeToggle from './ColorModeToggle'
import { OramaSearchPlugin } from './plugins/OramaSearchPlugin'
import VersionDropdown from './VersionDropdown'

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
    </>
  )
}

export default function MenuBar({
  hide = false,
  onHeightChange,
}: {
  hide?: boolean
  /** Called with the height the bar occupies, which the page below has to leave free. */
  onHeightChange?: (height: number) => void
}) {
  const theme = useTheme()
  const { Header } = useBrand()
  const { setContentInset } = useContentInset()
  const barRef = useRef<HTMLDivElement>(null)

  // Report where vdoc's own header content starts, so the framed documentation can line its header
  // up with it, and how tall the bar is, so the page below can leave that much room. Measured rather
  // than derived, because each brand's bar sets its own gutter and height, and both change with the
  // breakpoint. The start is the mark linking to `/`, which every brand's bar leads with.
  useEffect(() => {
    const bar = barRef.current
    if (bar === null) {
      return
    }
    const report = () => {
      const home = bar.querySelector('a[href="/"]')
      setContentInset(home ? home.getBoundingClientRect().left - bar.getBoundingClientRect().left : 0)
      onHeightChange?.(bar.getBoundingClientRect().height)
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [setContentInset, onHeightChange])

  return (
    <Slide appear={false} direction="down" in={!hide}>
      <Box ref={barRef} sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: theme.zIndex.appBar }}>
        <Header data-testid={testIDs.header.main} search={<MiddleGroup />} actions={<RightGroup />} />
      </Box>
    </Slide>
  )
}
