import { useEffect, useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { useRouter, useLocation } from '@tanstack/react-router'
import { useColorScheme } from '@mui/material'
import { fetchProjectVersion } from '../../helpers/APIFunctions'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import testIDs from '../../interfacesAndTypes/testIDs'
import ErrorComponent from '../../components/ErrorComponent'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'
import DeprecatedVersionBanner from '../../components/DeprecatedVersionBanner'
import SearchOffIcon from '@mui/icons-material/SearchOff'

const fetchVersionAndLatestVersion = async (projectName: string, version: string): Promise<[string, string]> => {
  // Check if requested version is available. If not, the loader throws an error and the error component is shown
  await fetchProjectVersion(projectName, version)

  const latestVersion = await fetchProjectVersion(projectName, 'latest')

  return [version, latestVersion]
}

export const Route = createFileRoute('/$projectName/$version/$')({
  component: DocumentationComponent,
  loader: async ({ params: { projectName, version } }) => {
    return fetchVersionAndLatestVersion(projectName, version)
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
    /**
     * Propagates the iframe navigation events to the tanstack router.
     *
     * @param iframeDocument The iframe document object.
     */
    const setupIframeNavigation = (iframeDocument: Document) => {
      const anchorElements = iframeDocument.querySelectorAll('a')

      anchorElements.forEach((anchor) => {
        if (!anchor.href) return
        if (anchor.origin === window.location.origin) {
          const params = sanitizeDocuUri(anchor.href, window.location.origin, name, version)
          anchor.pathname = anchor.pathname.replace('/static/projects', '').replace(`/${latestVersion}/`, '/latest/')
          anchor.addEventListener('click', (event) => {
            event.preventDefault()
            router.navigate({
              to: '/$projectName/$version/$',
              from: '/$projectName/$version/$',
              params: params,
            })
          })
        } else {
          // External links open in a new tab
          anchor.setAttribute('target', '_blank')
          anchor.setAttribute('rel', 'noopener noreferrer')
        }
      })
    }

    const checkForErrors = (iframeDocument: Document) => {
      if (iframeDocument.body.innerText === '{"detail":"Not Found"}') {
        throw new Error("Whoops! This page doesn't seem to exist...")
      }
    }
    if (iframeRef.current && loaded) {
      const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (iframeDocument) {
        checkForErrors(iframeDocument)
        setupIframeNavigation(iframeDocument)
      }
    }
  }, [router, loaded, name, version, latestVersion])

  useEffect(() => {
    const resultingMode = mode === 'system' ? systemMode : mode
    iframeRef?.current?.contentWindow?.localStorage.setItem('darkMode', resultingMode as 'light' | 'dark')
    setIframeKey(crypto.randomUUID())
  }, [mode, iframeRef, systemMode])

  return (
    <div data-testid={testIDs.project.documentation.main} style={{ display: 'contents' }}>
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
    </div>
  )
}
