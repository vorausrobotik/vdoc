import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { Link, useRouter, useLocation } from '@tanstack/react-router'
import { useTheme, Typography, Grid2 } from '@mui/material'
import { fetchProjectVersion, fetchProjectVersions } from '../../helpers/APIFunctions'
import { useQuery } from '@tanstack/react-query'
import globalStore from '../../helpers/GlobalStore'
import QueryStateHandler from '../../components/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'

export const Route = createFileRoute('/$projectName/$version/$')({
  component: DocumentationComponent,
})

const fetchProjectDetailsAndSetStore = async (projectName: string, version: string): Promise<[string, string]> => {
  const [versions, latestVersion] = await Promise.all([
    fetchProjectVersions(projectName),
    fetchProjectVersion(projectName, 'latest'),
  ])

  globalStore.setState((state) => ({
    ...state,
    projectName,
    projectVersions: versions,
    currentVersion: version,
    latestVersion,
  }))

  return [version, latestVersion]
}

function DocumentationComponent() {
  const { projectName, version, _splat } = Route.useParams()
  const location = useLocation()

  const {
    data: data,
    error: dataError,
    isLoading: dataLoading,
  } = useQuery({
    queryKey: ['projects', projectName, version],
    queryFn: () => fetchProjectDetailsAndSetStore(projectName, version),
  })

  return (
    <QueryStateHandler loading={dataLoading} error={dataError as FastAPIAxiosErrorT} data={data}>
      {([resolvedVersion, latestVersion]) => (
        <DocuIFrame
          key={location.href}
          name={projectName}
          version={resolvedVersion}
          latestVersion={latestVersion}
          splat={_splat}
        />
      )}
    </QueryStateHandler>
  )
}

interface DeprecatedVersionBannerPropsI {
  name: string
  version: string
}

function DeprecatedVersionBanner({ name, version }: DeprecatedVersionBannerPropsI) {
  const theme = useTheme()
  return (
    <Link
      to="/$projectName/$version/$"
      params={{ projectName: name, version: 'latest' }}
      style={{ textDecoration: 'none' }}
      data-testid={'latestVersionWarningBanner'}
    >
      <Grid2
        container
        direction="row"
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.warning.main,
        }}
      >
        <Typography variant="body1" color="black">
          You're currently reading an <b>old version</b> ({version}) of {name}! To view the latest version of the
          documentation, click this banner.
        </Typography>
      </Grid2>
    </Link>
  )
}

interface DocuIFramePropsI {
  name: string
  version: string
  latestVersion: string
  splat: string | undefined
}

function DocuIFrame({ name, version, latestVersion, splat }: DocuIFramePropsI) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  useEffect(() => {
    if (iframeRef.current) {
      const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      const currentOrigin = window.location.origin
      if (iframeDocument) {
        const anchorElements = iframeDocument.querySelectorAll('a')
        anchorElements.forEach((anchor) => {
          const href = anchor.getAttribute('href')
          if (href) {
            const result = sanitizeDocuUri(href, currentOrigin, name, version)
            const params = {
              projectName: result.project ?? name,
              version: result.version ?? version,
              _splat: result.remainder,
            }
            anchor.href = result.href
            anchor.addEventListener('click', (event) => {
              if (result.isInternal) {
                event.preventDefault()
                router.navigate({
                  to: '/$projectName/$version/$',
                  from: '/$projectName/$version/$',
                  params: params,
                })
              } else {
                anchor.target = 'blank'
              }
            })
          }
        })
      }
    }
  }, [router, loaded, name, version])
  return (
    <Fragment>
      {name && version !== 'latest' && version !== latestVersion && (
        <DeprecatedVersionBanner name={name} version={version} />
      )}
      <iframe
        data-testid={'docIframe'}
        ref={iframeRef}
        onLoad={() => setLoaded(true)}
        style={{ border: 0, width: '100%', height: '100%' }}
        src={`/static/projects/${name}/${version === 'latest' ? latestVersion : version}/${splat}${window.location.hash}`}
      />
    </Fragment>
  )
}
