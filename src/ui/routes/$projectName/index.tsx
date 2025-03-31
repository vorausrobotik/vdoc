import { useMemo, useCallback } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { FastAPIAxiosErrorT } from '../../interfacesAndTypes/Error'
import { fetchProjectVersions } from '../../helpers/APIFunctions'
import { groupVersionsByMajorVersion } from '../../helpers/Versions'
import { Typography, Container, Chip, Stack, Card, Grid, Box, CardContent } from '@mui/material'
import SellIcon from '@mui/icons-material/Sell'
import testIDs from '../../interfacesAndTypes/testIDs'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import ErrorComponent from '../../components/ErrorComponent'
import LoadingSpinner from '../../components/LoadingSpinner'

export const Route = createFileRoute('/$projectName/')({
  component: ProjectVersionsOverview,
  loader: async ({ params: { projectName } }) => {
    return fetchProjectVersions(projectName)
  },
  pendingComponent: LoadingSpinner,
  errorComponent: ({ error }) => {
    const ErrorComponentWithRouter = () => {
      const router = useRouter()
      const handleGoBack = useCallback(() => {
        router.history.back()
      }, [router])

      return <ErrorComponent iconClass={SearchOffIcon} error={error as FastAPIAxiosErrorT} onAction={handleGoBack} />
    }

    return <ErrorComponentWithRouter />
  },
})

function ProjectVersionsOverview() {
  const { projectName } = Route.useParams()
  const router = useRouter()

  const versions = Route.useLoaderData()

  const groupedVersions: Record<number, string[]> = useMemo(() => {
    return versions ? groupVersionsByMajorVersion(versions) : {}
  }, [versions])

  return (
    <Container sx={{ mt: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Version index of {projectName}
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {Object.keys(groupedVersions)
            .reverse()
            .map((major) => (
              <Grid size={6} key={major}>
                <Card key={major} data-testid={testIDs.project.versionOverview.majorVersionCard.main}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
                      <SellIcon />
                      <Typography variant="h6">v{major}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      {groupedVersions[Number(major)].map((version) => (
                        <Chip
                          data-testid={testIDs.project.versionOverview.majorVersionCard.versionItem.main}
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
              </Grid>
            ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default ProjectVersionsOverview
