import SentimentDissatisfied from '@mui/icons-material/SentimentDissatisfied'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import ErrorComponent from '../components/ErrorComponent'
import { fetchPluginConfig, fetchProjectCategories, fetchProjects } from '../helpers/APIFunctions'
import type SitePluginT from '../interfacesAndTypes/plugins/SitePlugin'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [projects, projectCategories, sitePluginConfig] = await Promise.all([
      fetchProjects(),
      fetchProjectCategories(),
      // In the loader so the banner is part of the first paint rather than arriving after it and
      // pushing the projects down. Caught, because the projects are what the page is for: a plugin
      // that cannot be read costs the introduction, not the page.
      fetchPluginConfig<SitePluginT>('site').catch(() => null),
    ])
    if (projects.length === 0) {
      throw new Error('No projects found')
    }
    return [projects, projectCategories, sitePluginConfig] as const
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
