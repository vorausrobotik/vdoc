import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { createFileRoute } from '@tanstack/react-router'
import QueryStateHandler from '../../../helpers/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../../interfacesAndTypes/Error'

export const Route = createFileRoute('/$projectName/versions/')({
  component: ProjectVersionsOverview,
})

const fetchProjectVersions = async (projectName: string): Promise<string[]> => {
  const response = await axios.get(`/api/projects/${projectName}/versions/`)
  return response.data
}

function ProjectVersionsOverview() {
  const { projectName } = Route.useParams()

  const {
    data: versions,
    error: versionsError,
    isLoading: versionsLoading,
  } = useQuery({
    queryKey: ['projects', projectName],
    queryFn: () => fetchProjectVersions(projectName),
  })
  return (
    <QueryStateHandler loading={versionsLoading} error={versionsError as FastAPIAxiosErrorT} data={versions}>
      {(versions) => (
        <>
          {versions.map((version) => (
            <ListItem key={version} disablePadding>
              <ListItemText primary={version} />
            </ListItem>
          ))}
        </>
      )}
    </QueryStateHandler>
  )
}

export default ProjectVersionsOverview
