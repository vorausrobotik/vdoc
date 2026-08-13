import SearchOffIcon from '@mui/icons-material/SearchOff'
import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import ErrorComponent from '../../components/ErrorComponent'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { fetchProjectVersion } from '../../helpers/APIFunctions'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'
import type { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'

const fetchVersionAndLatestVersion = async (projectName: string, version: string): Promise<string> => {
  // Check if requested version is available. If not, the loader throws an error and the error component is shown
  await fetchProjectVersion(projectName, version)

  return await fetchProjectVersion(projectName, 'latest')
}

/**
 * Resolves which version of a project is being read, for every page of it.
 *
 * This sits on `/$projectName/$version` rather than on the `/$/` route below it, because that is
 * what it depends on. A route's loader re-runs whenever its own params change, so while this lived
 * on the page route, turning a page inside the frame - which changes nothing but the splat - fired
 * two sequential, uncached HTTP requests for an answer that cannot have changed. Single page
 * documentation turns pages without a document load, so that happened on every click.
 */
export const Route = createFileRoute('/$projectName/$version')({
  component: Outlet,
  loader: async ({ params: { projectName, version }, location }) => {
    const latestVersion = await fetchVersionAndLatestVersion(projectName, version)
    if (version === 'latest') {
      throw redirect({
        to: '/$projectName/$version/$',
        params: {
          projectName,
          version: latestVersion,
          // The page to land on is not in this route's params, so it is read back out of the
          // address being resolved.
          _splat: sanitizeDocuUri(location.pathname)._splat,
        },
        hash: true, // Preserve the hash from the original URL
        search: true, // Preserve the search params from the original URL
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
