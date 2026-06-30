import { useCallback } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import { fetchProjectVersions, fetchProjectVersion } from '../../helpers/APIFunctions'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import ErrorComponent from '../../components/ErrorComponent'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ProjectVersionsOverview } from '../../components/ProjectVersionsOverview'

export const Route = createFileRoute('/$projectName/')({
  component: ProjectVersionsOverview,
  loader: async ({ params: { projectName } }): Promise<[string[], string]> => {
    return Promise.all([fetchProjectVersions(projectName), fetchProjectVersion(projectName, 'latest')])
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
