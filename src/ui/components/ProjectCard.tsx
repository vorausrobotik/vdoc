import { Box, CardActions, CardContent, Typography } from '@mui/material'
import { useBrand } from '@/brands/Brand'
import { latestVersion, projectTitle } from '@/helpers/Projects'
import { LinkCard } from '@/interfacesAndTypes/LinkCard'
import type { Project } from '@/interfacesAndTypes/Project'
import testIDs from '@/interfacesAndTypes/testIDs'

const cardIDs = testIDs.landingPage.projectCategories.projectCategory.projects.projectCard

/**
 * A project as a tile: its title and newest version, its description, then how many versions it has. The
 * whole tile opens the newest version, so it carries no action of its own.
 */
export function ProjectCard({ project }: { project: Project }) {
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
