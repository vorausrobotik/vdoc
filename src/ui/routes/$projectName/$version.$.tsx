import SearchOffIcon from '@mui/icons-material/SearchOff'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { object, optional, string } from 'valibot'
import { DocumentationComponent } from '../../components/DocumentationComponent'
import ErrorComponent from '../../components/ErrorComponent'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { fetchProjectVersion } from '../../helpers/APIFunctions'
import type { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'

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
