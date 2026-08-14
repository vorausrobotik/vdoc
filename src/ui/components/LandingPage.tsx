import { Box, Card, CardActions, CardContent, Container, Grid, Typography } from '@mui/material'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { groupProjectsByCategories } from '../helpers/Projects'
import { LinkButton } from '../interfacesAndTypes/LinkButton'
import type { Project, ProjectCategory } from '../interfacesAndTypes/Project'
import type SitePluginT from '../interfacesAndTypes/plugins/SitePlugin'
import testIDs from '../interfacesAndTypes/testIDs'
import { SitePlugin } from './plugins/SitePlugin'

const route = getRouteApi('/')

export function LandingPage() {
  const [projects, projectCategories, sitePluginConfig]: readonly [Project[], ProjectCategory[], SitePluginT | null] =
    route.useLoaderData()

  const getGroupedProjects = useMemo(() => {
    return groupProjectsByCategories(projects, projectCategories)
  }, [projects, projectCategories])
  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <SitePlugin config={sitePluginConfig} />
      {Object.entries(getGroupedProjects).map(([category, projects]) => (
        <Box key={category} sx={{ mb: 4 }} data-testid={testIDs.landingPage.projectCategories.projectCategory.main}>
          <Typography
            variant="h5"
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
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        // The minimum height keeps the cards of a row the same size. A single column has no row to
        // match, and holding every card open there only makes the list longer than it has to be.
        sx={{ minHeight: { xs: 'auto', sm: 120 } }}
        data-testid={testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main}
      >
        <CardContent>
          <Typography
            gutterBottom
            variant="h6"
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
            params={{ projectName: project.name, version: 'latest', _splat: '' }}
          >
            Open
          </LinkButton>
        </CardActions>
      </Card>
    </Grid>
  )
}
