import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import DocuCanvas from '../../../DocuCanvas'
import axios from 'axios'
import QueryStateHandler from '../../../helpers/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../../interfacesAndTypes/Error'

const fetchDocumentation = async (projectName: string, version: string): Promise<[string, string]> => {
  const response = await axios.get(`/api/projects/${projectName}/versions/${version}`)
  return response.data
}

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
    queryKey: ['project', projectName, version],
    queryFn: () => fetchDocumentation(projectName, version),
  })

  return (
    <QueryStateHandler loading={versionsLoading} error={versionsError as FastAPIAxiosErrorT} data={versions}>
      {(versions) => <DocuCanvas name={projectName} version={versions[0]} latestVersion={versions[1]} />}
    </QueryStateHandler>
  )
}
