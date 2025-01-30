import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import QueryStateHandler from '../../components/QueryStateHandler'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import { fetchProjectVersions } from '../../helpers/APIFunctions'
import globalStore from '../../helpers/GlobalStore'
import { groupVersionsByMajorVersion } from '../../helpers/Versions'
import { Typography, Container, Chip, Stack, Card, Grid2, Box, CardContent } from '@mui/material'
import SellIcon from '@mui/icons-material/Sell'

export const Route = createFileRoute('/$projectName/')({
  component: ProjectVersionsOverview,
})

function ProjectVersionsOverview() {
  const { projectName } = Route.useParams()
  const router = useRouter()
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

  const groupedVersions: Record<number, string[]> = useMemo(() => {
    return versions ? groupVersionsByMajorVersion(versions) : {}
  }, [versions])

  return (
    <QueryStateHandler loading={versionsLoading} error={versionsError as FastAPIAxiosErrorT} data={versions}>
      {() => (
        <Container sx={{ mt: 2 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Version index of {projectName}
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <Grid2 container spacing={2}>
              {Object.keys(groupedVersions)
                .reverse()
                .map((major) => (
                  <Grid2 size={6}>
                    <Card key={major} data-testid={'majorVersionCard'}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
                          <SellIcon />
                          <Typography variant="h6">v{major}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          {groupedVersions[Number(major)].map((version) => (
                            <Chip
                              data-testid={'versionLink'}
                              key={version}
                              label={version}
                              component="a"
                              onClick={() =>
                                router.navigate({
                                  to: '/$projectName/$version/$',
                                  from: '/$projectName',
                                  params: {
                                    projectName: projectName,
                                    version: version,
                                  },
                                })
                              }
                              clickable
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid2>
                ))}
            </Grid2>
          </Box>
        </Container>
      )}
    </QueryStateHandler>
  )
}

export default ProjectVersionsOverview
