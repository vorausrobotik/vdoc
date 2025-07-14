import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useRouter, useLocation } from '@tanstack/react-router'

import { fetchProjectVersion } from '../../helpers/APIFunctions'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import testIDs from '../../interfacesAndTypes/testIDs'
import ErrorComponent from '../../components/ErrorComponent'

import DeprecatedVersionBanner from '../../components/DeprecatedVersionBanner'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import IFrame from '../../components/IFrame'

const fetchVersionAndLatestVersion = async (projectName: string, version: string): Promise<string> => {
  // Check if requested version is available. If not, the loader throws an error and the error component is shown
  await fetchProjectVersion(projectName, version)

  return await fetchProjectVersion(projectName, 'latest')
}

export const Route = createFileRoute('/$projectName/$version/$')({
  component: DocumentationComponent,
  loader: async ({ params: { projectName, version, _splat } }) => {
    const latestVersion = await fetchVersionAndLatestVersion(projectName, version)
    if (version === 'latest') {
      throw redirect({
        to: '/$projectName/$version/$',
        params: {
          projectName,
          version: latestVersion,
          _splat: _splat || '',
        },
      })
    }
    return [version, latestVersion]
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

  const [iframeState, setIFrameState] = useState({
    name: props.name,
    page: props.page,
    hash: props.hash,
  })

  const iFrameSrc = useMemo(() => {
    const hashSuffix = iframeState.hash.trim() !== '' ? `#${iframeState.hash}` : ''
    return `/static/projects/${iframeState.name}/${props.version}/${iframeState.page}${hashSuffix}`
  }, [iframeState.name, props.version, iframeState.page, iframeState.hash])

  const iframeTitleChanged = (newTitle: string | undefined | null): void => {
    if (newTitle && newTitle !== document.title) {
      document.title = newTitle
    }
  }

  const iFramePageChanged = (newPage: string): void => {
    setIFrameState((prevState) => {
      return { ...prevState, page: newPage }
    })
  }

  const iFrameHashChanged = (newHash: string): void => {
    setIFrameState((prevState) => {
      return { ...prevState, hash: newHash }
    })
  }

  const iFrameNotFound = (): void => {
    setError(new Error("Whoops! This page doesn't seem to exist..."))
  }

  useEffect(() => {
    // Throwing the error in a useEffect to ensure it is caught by the error component of tanstack router.
    if (error) {
      throw error
    }
    const hashSuffix = iframeState.hash.trim() !== '' ? `#${iframeState.hash}` : ''
    const toParams = {
      projectName: iframeState.name,
      version: props.version,
      _splat: `${iframeState.page}${hashSuffix}`,
    }
    router.navigate({
      from: '/$projectName/$version/$',
      to: '/$projectName/$version/$',
      params: toParams,
    })
  }, [error, iframeState.name, props.version, iframeState.page, iframeState.hash, router])

  return (
    <div data-testid={testIDs.project.documentation.main} style={{ display: 'contents' }}>
      {props.name && props.version !== 'latest' && props.version !== props.latestVersion && (
        <DeprecatedVersionBanner name={props.name} version={props.version} />
      )}
      <IFrame
        src={iFrameSrc}
        onPageChanged={iFramePageChanged}
        onHashChanged={iFrameHashChanged}
        onTitleChanged={iframeTitleChanged}
        onNotFound={iFrameNotFound}
      />
    </div>
  )
}
