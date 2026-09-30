import type { Project, ProjectCategory } from '../interfacesAndTypes/Project'

/** The name a reader is shown: the display name if one is set, otherwise the project name. */
export const projectTitle = (project: Project): string => project.display_name ?? project.name

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
