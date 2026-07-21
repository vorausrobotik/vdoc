import SentimentDissatisfied from '@mui/icons-material/SentimentDissatisfied'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import ErrorComponent from '../components/ErrorComponent'
import { fetchProjectCategories, fetchProjects } from '../helpers/APIFunctions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [projects, projectCategories] = await Promise.all([fetchProjects(), fetchProjectCategories()])
    if (projects.length === 0) {
      throw new Error('No projects found')
    }
    return [projects, projectCategories]
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
