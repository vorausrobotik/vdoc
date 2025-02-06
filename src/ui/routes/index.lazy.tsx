import { createLazyFileRoute } from '@tanstack/react-router'
import QueryStateHandler from '../components/QueryStateHandler'
import { useQuery } from '@tanstack/react-query'
import { FastAPIAxiosErrorT } from '../interfacesAndTypes/Error'
import { LinkButton } from '../interfacesAndTypes/LinkButton'
import { Box, Container, Card, CardActions, CardContent, Grid2, Typography } from '@mui/material'
import { fetchProjects } from '../helpers/APIFunctions'
import ErrorComponent from '../components/ErrorComponent'
import { SentimentDissatisfied } from '@mui/icons-material'
import testIDs from '../interfacesAndTypes/testIDs'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  const {
    data: projects,
    error: projectsError,
    isLoading: projectsLoading,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
  })

  return (
    <QueryStateHandler loading={projectsLoading} error={projectsError as FastAPIAxiosErrorT} data={projects}>
      {(projects) => (
        <Container sx={{ mt: 2 }}>
          {projects.length > 0 ? (
            <Box sx={{ flexGrow: 1 }}>
              <Grid2
                container
                direction="row"
                sx={{
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
                spacing={2}
              >
                {projects.map((project) => (
                  <Grid2 key={project.name} size={{ xs: 6, md: 4, lg: 3 }}>
                    <Card sx={{ minHeight: 140 }} data-testid={testIDs.landingPage.projectCard.main}>
                      <CardContent>
                        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                          {project.name}
                        </Typography>
                      </CardContent>
                      <CardActions data-testid={testIDs.landingPage.projectCard.actions.main}>
                        <LinkButton
                          data-testid={testIDs.landingPage.projectCard.actions.documentationLink}
                          to={`/$projectName/$version/$`}
                          params={{ projectName: project.name, version: 'latest' }}
                          size="small"
                        >
                          Documentation
                        </LinkButton>
                      </CardActions>
                    </Card>
                  </Grid2>
                ))}
              </Grid2>
            </Box>
          ) : (
            <ErrorComponent
              title="No projects found"
              iconClass={SentimentDissatisfied}
              iconColor="primary"
              description="Upload docs to vdoc to get started!"
              actionText="Reload Projects"
              onAction={refetch}
              sx={{ mt: 2 }}
            />
          )}
        </Container>
      )}
    </QueryStateHandler>
  )
}
