import { Box } from '@mui/material'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useBrand } from '@/brands/Brand'
import { groupProjectsByCategories, PROJECTS_SECTION_ID } from '@/helpers/Projects'
import type { Project, ProjectCategory } from '@/interfacesAndTypes/Project'
import testIDs from '@/interfacesAndTypes/testIDs'
import { ContentColumn } from './ContentColumn'
import { ProjectCard } from './ProjectCard'
import { SitePlugin } from './plugins/SitePlugin'

const route = getRouteApi('/_site/')
const rootRoute = getRouteApi('__root__')

const categoryIDs = testIDs.landingPage.projectCategories.projectCategory

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
