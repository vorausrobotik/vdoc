import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchProjects } from '../helpers/APIFunctions'
import ErrorComponent from '../components/ErrorComponent'
import { SentimentDissatisfied } from '@mui/icons-material'

export const Route = createFileRoute('/')({
  loader: async () => {
    const projects = await fetchProjects()
    if (projects.length === 0) {
      throw new Error('No projects found')
    }
    return projects
  },
  errorComponent: ({ error }) => {
    const ErrorComponentWithRouter = () => {
      const router = useRouter()

      const handleReload = () => {
        router.invalidate()
      }
      return (
        <ErrorComponent
          error={error}
          iconClass={SentimentDissatisfied}
          iconColor="primary"
          description="Upload docs to vdoc to get started!"
          actionText="Reload Projects"
          sx={{ mt: 2 }}
          onAction={handleReload}
        />
      )
    }

    return <ErrorComponentWithRouter />
  },
})
