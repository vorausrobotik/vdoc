import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import DocuCanvas from '../../../DocuCanvas'
import QueryStateHandler from '../../../helpers/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../../interfacesAndTypes/Error'
import { fetchProjectVersionAndLatestVersion, fetchProjectVersions } from '../../../helpers/APIFunctions'

export const Route = createFileRoute('/$projectName/versions/$version')({
  component: DocumentationComponent,
})

function DocumentationComponent() {
  const { projectName, version } = Route.useParams()
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
