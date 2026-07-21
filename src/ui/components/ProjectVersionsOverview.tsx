import SellIcon from '@mui/icons-material/Sell'
import { Badge, Box, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'
import { groupVersionsByMajorVersion } from '../helpers/Versions'
import testIDs from '../interfacesAndTypes/testIDs'

const route = getRouteApi('/$projectName/')

export function ProjectVersionsOverview() {
  const { projectName } = route.useParams()
  const router = useRouter()

  const [versions, latestVersion] = route.useLoaderData()

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
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 2 }}>
                      <SellIcon />
                      <Typography variant="h6">v{major}</Typography>
                    </Stack>
                    <Grid
                      container
                      direction="row"
                      spacing={1}
                      sx={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                      }}
                    >
                      {groupedVersions[Number(major)].map((version) => {
                        const chip = (
                          <Grid key={version} sx={{ mb: 1 }}>
                            <Chip
                              data-testid={testIDs.project.versionOverview.majorVersionCard.versionItem.main}
                              label={version}
                              component="a"
                              onClick={() =>
                                router.navigate({
                                  to: '/$projectName/$version/$',
                                  from: '/$projectName/',
                                  params: {
                                    projectName: projectName,
                                    version: version,
                                  },
                                })
                              }
                              clickable
                            />
                          </Grid>
                        )
                        return version === latestVersion ? (
                          <Badge
                            key={version}
                            data-testid={testIDs.project.versionOverview.majorVersionCard.versionItem.latestBadge}
                            color="success"
                            badgeContent="latest"
                          >
                            {chip}
                          </Badge>
                        ) : (
                          chip
                        )
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
    </Container>
  )
}
