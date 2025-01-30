import { createLazyFileRoute } from '@tanstack/react-router'
import QueryStateHandler from '../components/QueryStateHandler'
import { useQuery } from '@tanstack/react-query'
import { FastAPIAxiosErrorT } from '../interfacesAndTypes/Error'
import { LinkButton } from '../interfacesAndTypes/LinkButton'
import { Box, Container, Card, CardActions, CardContent, Grid2, Typography } from '@mui/material'
import { fetchProjects } from '../helpers/APIFunctions'
import EmptyState from '../components/EmptyState'
import { SentimentDissatisfied } from '@mui/icons-material'

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
                    <Card sx={{ minHeight: 140 }} data-testid={'projectCard'}>
                      <CardContent>
                        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                          {project.name}
                        </Typography>
                      </CardContent>
                      <CardActions data-testid={'projectCardActions'}>
                        <LinkButton
                          data-testid={'projectCardDocumentationButton'}
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
            <EmptyState
              title="No projects found"
              iconClass={SentimentDissatisfied}
              description="Upload docs to vdoc to get started!"
              actionText="Reload Projects"
              onAction={refetch}
            />
          )}
        </Container>
      )}
    </QueryStateHandler>
  )
}
