import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { useRouter, useLocation } from '@tanstack/react-router'

import { fetchProjectVersion } from '../../helpers/APIFunctions'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import testIDs from '../../interfacesAndTypes/testIDs'
import ErrorComponent from '../../components/ErrorComponent'

import DeprecatedVersionBanner from '../../components/DeprecatedVersionBanner'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import IFrame from '../../components/IFrame'

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
  const location = useLocation()
  const { projectName, _splat } = Route.useParams()
  const [resolvedVersion, latestVersion] = Route.useLoaderData()

  const iframeProps = useMemo(
    () => ({
      name: projectName,
      version: resolvedVersion,
      latestVersion: latestVersion,
      page: _splat || '',
      hash: location.hash,
    }),
    [_splat, location.hash, latestVersion, projectName, resolvedVersion]
  )

  return <DocuIFrame {...iframeProps} />
}

interface DocuIFramePropsI {
  name: string
  version: string
  latestVersion: string
  page: string
  hash: string
}

function DocuIFrame(props: DocuIFramePropsI) {
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const resolvedVersion = useRef<string>(props.version === 'latest' ? props.latestVersion : props.version)

  const iFrameSrc = useMemo(() => {
    const resolvedVersion = props.version === 'latest' ? props.latestVersion : props.version
    const hashSuffix = props.hash.trim() !== '' ? `#${props.hash}` : ''
    return `/static/projects/${props.name}/${resolvedVersion}/${props.page}${hashSuffix}`
  }, [props.name, props.page, props.hash, props.version, props.latestVersion])

  const updateUrl = (name: string, version: string, page: string, hash: string): void => {
    const hashSuffix = hash.trim() !== '' ? `#${hash}` : ''
    const toParams = {
      projectName: name,
      version: version,
      _splat: `${page}${hashSuffix}`,
    }
    router.navigate({
      from: '/$projectName/$version/$',
      to: '/$projectName/$version/$',
      params: toParams,
    })
  }

  const updateTitle = (newTitle: string): void => {
    document.title = newTitle
  }

  const iFramePageChanged = (urlPage: string, urlHash: string, title?: string): void => {
    if (title != null && title !== document.title) {
      updateTitle(title)
    }
    if (urlPage === props.page) {
      return
    }
    updateUrl(props.name, resolvedVersion.current, urlPage, urlHash)
  }

  const iFrameHashChanged = (newHash: string): void => {
    if (newHash === props.hash) {
      return
    }
    updateUrl(props.name, resolvedVersion.current, props.page, newHash)
  }

  const iFrameNotFound = (): void => {
    setError(new Error("Whoops! This page doesn't seem to exist..."))
  }

  useEffect(() => {
    // Throwing the error in a useEffect to ensure it is caught by the error component of tanstack router.
    if (error) {
      throw error
    }
  }, [error])

  return (
    <div data-testid={testIDs.project.documentation.main} style={{ display: 'contents' }}>
      {props.name && props.version !== 'latest' && props.version !== props.latestVersion && (
        <DeprecatedVersionBanner name={props.name} version={props.version} />
      )}
      <IFrame
        src={iFrameSrc}
        onPageChanged={iFramePageChanged}
        onHashChanged={iFrameHashChanged}
        onTitleChanged={updateTitle}
        onNotFound={iFrameNotFound}
      />
    </div>
  )
}
