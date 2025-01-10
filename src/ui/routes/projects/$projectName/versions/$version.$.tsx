import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import DocuCanvas from '../../../../DocuCanvas'
import {
  fetchProjectVersionAndLatestVersion as fetchProjectVersion,
  fetchProjectVersions,
} from '../../../../helpers/APIFunctions'
import globalStore from '../../../../helpers/GlobalStore'

export const Route = createFileRoute('/projects/$projectName/versions/$version/$')({
  component: DocumentationComponent,
})

function DocumentationComponent() {
  const { projectName, version, _splat } = Route.useParams()
  const searchParams = Route.useSearch()
  console.log('DocumentationComponent: Splat is', _splat)
  console.log('DocumentationComponent: searchParams are', JSON.stringify(searchParams))
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

  return <DocuCanvas remainingPath={_splat} />
}
