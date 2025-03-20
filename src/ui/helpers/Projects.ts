import type { Project, ProjectCategory } from '../interfacesAndTypes/Project'

export function groupProjectsByCategories(
  projects: Project[],
  projectCategories: ProjectCategory[]
): Record<string, Project[]> {
  const grouped: Record<string, Project[]> = {}
  const categoriesCopy = [...projectCategories, { id: null, name: 'Misc' }]

  categoriesCopy.forEach((category) => {
    const filteredProjects = projects.filter((project) => project.category_id === category.id)
    if (filteredProjects.length > 0) {
      grouped[category.name] = filteredProjects
    }
  })

  return grouped
}
