import { createLazyFileRoute } from '@tanstack/react-router'
import { LinkButton } from '../interfacesAndTypes/LinkButton'
import { Box, Container, Card, CardActions, CardContent, Grid2, Typography } from '@mui/material'
import testIDs from '../interfacesAndTypes/testIDs'
import { Project } from '../interfacesAndTypes/Project'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  const projects: Project[] = Route.useLoaderData()
  return (
    <Container sx={{ mt: 2 }}>
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
                  <Typography
                    gutterBottom
                    sx={{ color: 'text.secondary', fontSize: 14 }}
                    data-testid={testIDs.landingPage.projectCard.title}
                  >
                    {project.display_name}
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
    </Container>
  )
}
