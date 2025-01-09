import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import DocuCanvas from '../../../DocuCanvas'
import QueryStateHandler from '../../../helpers/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../../interfacesAndTypes/Error'
import { fetchProjectVersionAndLatestVersion, fetchProjectVersions } from '../../../helpers/APIFunctions'
import globalStore from '../../../helpers/GlobalStore'

export const Route = createFileRoute('/$projectName/versions/$version')({
  component: DocumentationComponent,
})

function DocumentationComponent() {
  const { projectName, version } = Route.useParams()
  useEffect(() => {
    // Fetch all available versions for the project and put them into the global store object
    fetchProjectVersions(projectName).then((versions) =>
      globalStore.setState((state) => {
        return {
          ...state,
          projectVersions: versions,
          currentVersion: version,
        }
      })
    )
  }, [projectName, version])
  const {
    data: versions,
    error: versionsError,
    isLoading: versionsLoading,
  } = useQuery({
    queryKey: ['projects', projectName, version],
    queryFn: () => fetchProjectVersionAndLatestVersion(projectName, version),
  })

  return (
    <QueryStateHandler loading={versionsLoading} error={versionsError as FastAPIAxiosErrorT} data={versions}>
      {(versions) => <DocuCanvas name={projectName} version={versions[0]} latestVersion={versions[1]} />}
    </QueryStateHandler>
  )
}
