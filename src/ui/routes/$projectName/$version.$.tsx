import { useEffect, useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { useRouter, useLocation } from '@tanstack/react-router'
import { useColorScheme } from '@mui/material'
import { fetchProjectVersion, fetchProjectVersions } from '../../helpers/APIFunctions'
import globalStore from '../../helpers/GlobalStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'
import testIDs from '../../interfacesAndTypes/testIDs'
import ErrorComponent from '../../components/ErrorComponent'
import DeprecatedVersionBanner from '../../components/DeprecatedVersionBanner'
import SearchOffIcon from '@mui/icons-material/SearchOff'

const fetchProjectDetailsAndSetStore = async (projectName: string, version: string): Promise<[string, string]> => {
  // Check if the requested version is available
  await fetchProjectVersion(projectName, version)

  // Fetch more information
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

export const Route = createFileRoute('/$projectName/$version/$')({
  component: DocumentationComponent,
  loader: async ({ params: { projectName, version } }) => {
    return fetchProjectDetailsAndSetStore(projectName, version)
  },
  pendingComponent: LoadingSpinner,
  errorComponent: ({ error }) => {
    const ErrorComponentWithRouter = () => {
      const router = useRouter()
      const handleGoBack = useCallback(() => {
        router.history.back()
      }, [router])

      return <ErrorComponent iconClass={SearchOffIcon} error={error as FastAPIAxiosErrorT} onAction={handleGoBack} />
    }

    return <ErrorComponentWithRouter />
  },
})

function DocumentationComponent() {
  const { projectName, _splat } = Route.useParams()
  const location = useLocation()
  const [resolvedVersion, latestVersion] = Route.useLoaderData()

  return (
    <DocuIFrame
      key={location.href}
      name={projectName}
      version={resolvedVersion}
      latestVersion={latestVersion}
      splat={_splat}
    />
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
  const [iframeKey, setIframeKey] = useState<string>(crypto.randomUUID())
  const { mode, systemMode } = useColorScheme()

  useEffect(() => {
    if (iframeRef.current && loaded) {
      const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (iframeDocument) {
        const anchorElements = iframeDocument.querySelectorAll('a')
        anchorElements.forEach((anchor) => {
          const href = anchor.getAttribute('href')
          if (href) {
            const result = sanitizeDocuUri(href, window.location.origin, name, version)
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

  useEffect(() => {
    const resultingMode = mode === 'system' ? systemMode : mode
    iframeRef?.current?.contentWindow?.localStorage.setItem('darkMode', resultingMode as 'light' | 'dark')
    setIframeKey(crypto.randomUUID())
  }, [mode, iframeRef, systemMode])

  return (
    <Fragment data-testid={testIDs.project.documentation.main}>
      {name && version !== 'latest' && version !== latestVersion && (
        <DeprecatedVersionBanner name={name} version={version} />
      )}
      <iframe
        key={iframeKey}
        data-testid={testIDs.project.documentation.documentationIframe}
        ref={iframeRef}
        onLoad={() => setLoaded(true)}
        style={{ border: 0, width: '100%', height: '100%' }}
        src={`/static/projects/${name}/${version === 'latest' ? latestVersion : version}/${splat}${window.location.hash}`}
      />
    </Fragment>
  )
}
