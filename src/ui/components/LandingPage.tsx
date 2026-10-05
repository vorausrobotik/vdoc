import { Box, CardActions, CardContent, Typography } from '@mui/material'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useBrand } from '@/brands/Brand'
import { groupProjectsByCategories, latestVersion, PROJECTS_SECTION_ID, projectTitle } from '@/helpers/Projects'
import { LinkCard } from '@/interfacesAndTypes/LinkCard'
import type { Project, ProjectCategory } from '@/interfacesAndTypes/Project'
import testIDs from '@/interfacesAndTypes/testIDs'
import { ContentColumn } from './ContentColumn'
import { SitePlugin } from './plugins/SitePlugin'

const route = getRouteApi('/_site/')
const rootRoute = getRouteApi('__root__')

const categoryIDs = testIDs.landingPage.projectCategories.projectCategory
const cardIDs = categoryIDs.projects.projectCard

export function LandingPage() {
  const [projects, projectCategories]: readonly [Project[], ProjectCategory[]] = route.useLoaderData()
  const { sitePluginConfig } = rootRoute.useLoaderData()
  const { SectionLabel } = useBrand()

  const groupedProjects = useMemo(
    () => Object.entries(groupProjectsByCategories(projects, projectCategories)),
    [projects, projectCategories]
  )

  return (
    // A block of its own: the content area is a flex column, which would squeeze a hero that clips
    // its overflow, as the voraus hero does, since such a hero has no minimum height of its own
    <Box>
      <SitePlugin config={sitePluginConfig} projects={projects} />
      <ContentColumn id={PROJECTS_SECTION_ID} sx={{ py: 6 }}>
        {groupedProjects.map(([category, projects]) => (
          <Box key={category} component="section" sx={{ mb: 6 }} data-testid={categoryIDs.main}>
            <SectionLabel data-testid={categoryIDs.title}>{category}</SectionLabel>
            <Box
              data-testid={categoryIDs.projects.main}
              sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' } }}
            >
              {projects.map((project) => (
                <ProjectCard key={project.name} project={project} />
              ))}
            </Box>
          </Box>
        ))}
      </ContentColumn>
    </Box>
  )
}

/**
 * A project as a tile: its title and newest version, its description, then how many versions it has. The
 * whole tile opens the newest version, so it carries no action of its own.
 */
function ProjectCard({ project }: { project: Project }) {
  const { VersionBadge } = useBrand()
  const count = project.versions.length
  const version = latestVersion(project)?.version
  return (
    <LinkCard
      variant="tile"
      data-testid={cardIDs.main}
      to="/$projectName/$version/$"
      params={{ projectName: project.name, version: 'latest', _splat: '' }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.75 }}>
          <Typography variant="h3" data-testid={cardIDs.title}>
            {projectTitle(project)}
          </Typography>
          {version && <VersionBadge version={version} />}
        </Box>
        {project.description && (
          <Typography color="textSecondary" sx={{ mt: 1.5 }} data-testid={cardIDs.description}>
            {project.description}
          </Typography>
        )}
      </CardContent>
      <CardActions data-testid={cardIDs.actions.main}>
        <Typography variant="caption" color="textSecondary">
          {count} {count === 1 ? 'version' : 'versions'} published
        </Typography>
      </CardActions>
    </LinkCard>
  )
}
