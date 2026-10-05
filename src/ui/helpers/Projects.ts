import type { Project, ProjectCategory, ProjectVersion } from '@/interfacesAndTypes/Project'

/** Where the landing page lists the projects, for the hero to scroll to. */
export const PROJECTS_SECTION_ID = 'projects'

/**
 * The name a reader is shown: the display name if one is set, otherwise the project name. An empty
 * display name counts as unset, as the admin's form holds one until it is saved.
 */
export const projectTitle = (project: Project): string => project.display_name || project.name

/** The newest version of a project, or undefined for one that has none. */
export const latestVersion = (project: Project): ProjectVersion | undefined =>
  project.versions[project.versions.length - 1]

export function groupProjectsByCategories(
  projects: Project[],
  projectCategories: ProjectCategory[]
): Record<string, Project[]> {
  const grouped: Record<string, Project[]> = {}
  const categoriesCopy = [...projectCategories, { id: null, name: 'Misc' }].sort((a, b) => {
    if (a.id === null) return 1
    if (b.id === null) return -1
    return a.id - b.id
  })

  categoriesCopy.forEach((category) => {
    const filteredProjects = projects.filter((project) => project.category_id === category.id)
    if (filteredProjects.length > 0) {
      grouped[category.name] = filteredProjects
    }
  })

  return grouped
}
