import { useQuery } from '@tanstack/react-query'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { createFileRoute } from '@tanstack/react-router'
import QueryStateHandler from '../../../helpers/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../../interfacesAndTypes/Error'
import { fetchProjectVersions } from '../../../helpers/APIFunctions'
import globalStore from '../../../helpers/GlobalStore'

export const Route = createFileRoute('/$projectName/versions/')({
  component: ProjectVersionsOverview,
})

function ProjectVersionsOverview() {
  const { projectName } = Route.useParams()
  globalStore.setState((state) => {
    return {
      ...state,
      projectVersions: null,
      currentVersion: null,
    }
  })

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
