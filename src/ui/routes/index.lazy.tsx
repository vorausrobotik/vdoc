import { useMemo } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { LinkButton } from '../interfacesAndTypes/LinkButton'
import { groupProjectsByCategories } from '../helpers/Projects'
import { Box, Container, Card, CardActions, CardContent, Grid, Typography } from '@mui/material'
import testIDs from '../interfacesAndTypes/testIDs'
import { Project, ProjectCategory } from '../interfacesAndTypes/Project'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  const [projects, projectCategories]: [Project[], ProjectCategory[]] = Route.useLoaderData()

  const getGroupedProjects = useMemo(() => {
    return groupProjectsByCategories(projects, projectCategories)
  }, [projects, projectCategories])
  return (
    <Container sx={{ mt: 2 }}>
      {Object.entries(getGroupedProjects).map(([category, projects]) => (
        <Box key={category} sx={{ mb: 4 }} data-testid={testIDs.landingPage.projectCategories.projectCategory.main}>
          <Typography
            variant="h6"
            sx={{ mb: 2, textTransform: 'uppercase' }}
            data-testid={testIDs.landingPage.projectCategories.projectCategory.title}
          >
            {category}
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              direction="row"
              sx={{
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
              spacing={2}
              data-testid={testIDs.landingPage.projectCategories.projectCategory.projects.main}
            >
              {projects.map((project) => (
                <IndexProjectCard key={project.name} project={project} />
              ))}
            </Grid>
          </Box>
        </Box>
      ))}
    </Container>
  )
}

function IndexProjectCard({ project }: { project: Project }) {
  return (
    <Grid size={{ xs: 6, md: 4, lg: 3 }}>
      <Card
        sx={{ minHeight: 120 }}
        data-testid={testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main}
      >
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: 'text.secondary', fontSize: 14 }}
            data-testid={testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.title}
          >
            {project.display_name}
          </Typography>
        </CardContent>
        <CardActions
          data-testid={testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.actions.main}
        >
          <LinkButton
            data-testid={
              testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.actions.documentationLink
            }
            to={`/$projectName/$version/$`}
            params={{ projectName: project.name, version: 'latest' }}
            size="small"
          >
            Documentation
          </LinkButton>
        </CardActions>
      </Card>
    </Grid>
  )
}
