import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useRouter, useLocation } from '@tanstack/react-router'
import { object, optional, string } from 'valibot'

import { fetchProjectVersion } from '../../helpers/APIFunctions'
import { IFrameLocation } from '../../helpers/IFrame'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import testIDs from '../../interfacesAndTypes/testIDs'
import ErrorComponent from '../../components/ErrorComponent'

import DeprecatedVersionBanner from '../../components/DeprecatedVersionBanner'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import IFrame from '../../components/IFrame'

// Schema for search parameters
const searchSchema = object({
  q: optional(string()),
})

const fetchVersionAndLatestVersion = async (projectName: string, version: string): Promise<string> => {
  // Check if requested version is available. If not, the loader throws an error and the error component is shown
  await fetchProjectVersion(projectName, version)

  return await fetchProjectVersion(projectName, 'latest')
}

export const Route = createFileRoute('/$projectName/$version/$')({
  component: DocumentationComponent,
  validateSearch: searchSchema,
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
      search: location.search,
    }),
    [_splat, location.hash, location.search, latestVersion, projectName, resolvedVersion]
  )

  return <DocuIFrame {...iframeProps} />
}

interface DocuIFramePropsI {
  name: string
  version: string
  latestVersion: string
  page: string
  hash: string
  search: object
}

function DocuIFrame(props: DocuIFramePropsI) {
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  const [iframeState, setIFrameState] = useState<IFrameLocation>({
    name: props.name,
    version: props.version,
    page: props.page,
    title: '',
    hash: props.hash,
    search: new URLSearchParams(),
  })

  const iFrameSrc = useMemo(() => {
    const hashSuffix = props.hash.trim() !== '' ? `#${props.hash}` : ''
    const searchParams = new URLSearchParams(props.search as Record<string, string>)
    const searchString = searchParams.toString()
    const searchSuffix = searchString ? `?${searchString}` : ''
    return `/static/projects/${props.name}/${props.version}/${props.page}${searchSuffix}${hashSuffix}`
  }, [props.name, props.version, props.page, props.hash, props.search])

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

  const iFrameSearchChanged = (newSearch: URLSearchParams): void => {
    setIFrameState((prevState) => {
      return { ...prevState, search: newSearch }
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

    // Convert URLSearchParams to search object for TanStack Router
    // Only include non-empty values
    const searchObject: Record<string, string | undefined> = {}
    iframeState.search.forEach((value, key) => {
      if (value) {
        searchObject[key] = value
      }
    })

    router.navigate({
      from: '/$projectName/$version/$',
      to: '/$projectName/$version/$',
      params: toParams,
      search: (prev) => ({
        ...prev,
        ...searchObject,
      }),
    })
  }, [error, iframeState.name, props.version, iframeState.page, iframeState.hash, iframeState.search, router])

  return (
    <div data-testid={testIDs.project.documentation.main} style={{ display: 'contents' }}>
      {props.name && props.version !== 'latest' && props.version !== props.latestVersion && (
        <DeprecatedVersionBanner name={props.name} version={props.version} />
      )}
      <IFrame
        src={iFrameSrc}
        onPageChanged={iFramePageChanged}
        onHashChanged={iFrameHashChanged}
        onSearchChanged={iFrameSearchChanged}
        onTitleChanged={iframeTitleChanged}
        onNotFound={iFrameNotFound}
      />
    </div>
  )
}
