import { describe, test, expect } from 'vitest'
import { groupProjectsByCategories } from '../../helpers/Projects'
import { Project, ProjectCategory } from '../../interfacesAndTypes/Project'

describe('groupProjectsByCategories', () => {
  const baseProjects: Project[] = [
    { name: 'Project A', display_name: 'Proj A', category_id: 1 },
    { name: 'Project B', display_name: 'Proj B', category_id: 2 },
    { name: 'Project C', display_name: 'Proj C', category_id: null },
    { name: 'Project D', display_name: 'Proj D', category_id: 1 },
  ]

  const baseCategories: ProjectCategory[] = [
    { id: 1, name: 'Category 1' },
    { id: 2, name: 'Category 2' },
  ]

  test('should group projects correctly by category', () => {
    const result = groupProjectsByCategories(baseProjects, baseCategories)

    expect(result).toEqual({
      'Category 1': [baseProjects[0], baseProjects[3]],
      'Category 2': [baseProjects[1]],
      Misc: [baseProjects[2]],
    })
  })

  test('should return an empty object if there are no projects', () => {
    const result = groupProjectsByCategories([], baseCategories)
    expect(result).toEqual({})
  })

  test('should return only categories that contain projects', () => {
    const result = groupProjectsByCategories([baseProjects[0]], baseCategories)

    expect(result).toEqual({ 'Category 1': [baseProjects[0]] })
  })

  test("should return projects sorted by category_id, with 'Misc' at the end", () => {
    const result = Object.keys(groupProjectsByCategories(baseProjects, baseCategories))
    expect(result).toEqual(['Category 1', 'Category 2', 'Misc'])
  })

  test('should correctly handle additional categories and projects dynamically', () => {
    const extraProjects: Project[] = [
      { name: 'Project E', display_name: 'Proj E', category_id: 3 },
      { name: 'Project F', display_name: 'Proj F', category_id: null },
    ]

    const extraCategories: ProjectCategory[] = [...baseCategories, { id: 3, name: 'Category 3' }]

    const result = groupProjectsByCategories([...baseProjects, ...extraProjects], extraCategories)

    expect(result).toEqual({
      'Category 1': [baseProjects[0], baseProjects[3]],
      'Category 2': [baseProjects[1]],
      'Category 3': [extraProjects[0]],
      Misc: [baseProjects[2], extraProjects[1]],
    })

    expect(Object.keys(result)).toEqual(['Category 1', 'Category 2', 'Category 3', 'Misc'])
  })
})
