import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import DocuCanvas from '../../../../DocuCanvas'
import {
  fetchProjectVersionAndLatestVersion as fetchProjectVersion,
  fetchProjectVersions,
} from '../../../../helpers/APIFunctions'
import globalStore from '../../../../helpers/GlobalStore'

export const Route = createFileRoute('/projects/$projectName/versions/$version')({
  component: DocumentationComponent,
})

function DocumentationComponent() {
  const { projectName, version } = Route.useParams()
  useEffect(() => {
    const fetchData = async () => {
      const [versions, latestVersion] = await Promise.all([
        fetchProjectVersions(projectName),
        fetchProjectVersion(projectName, 'latest'),
      ])

      globalStore.setState((state) => ({
        ...state,
        projectName,
        projectVersions: versions,
        currentVersion: version,
        latestVersion,
      }))
    }

    fetchData()
  }, [projectName, version])

  return <DocuCanvas />
}
