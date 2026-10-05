import axios from 'axios'
import type { FastAPIAxiosErrorT } from '@/interfacesAndTypes/Error'
import type { Project, ProjectCategory } from '@/interfacesAndTypes/Project'

/** The message vdoc answered an API error with, or the error's own message if it did not answer. */
export const apiErrorMessage = (error: unknown): string =>
  (error as FastAPIAxiosErrorT).response?.data?.message ?? (error as Error).message

export const fetchProjectVersion = async (projectName: string, version: string): Promise<string> => {
  return (await axios.get(`/api/projects/${projectName}/versions/${version}`)).data
}

export const fetchProjectVersions = async (projectName: string): Promise<string[]> => {
  return (await axios.get(`/api/projects/${projectName}/versions/`)).data
}

export const fetchProjects = async (options?: { includeHidden?: boolean }): Promise<Project[]> => {
  return (await axios.get(`/api/projects/`, { params: { include_hidden: options?.includeHidden } })).data
}

export const updateProject = async (project: Project): Promise<Project> => {
  return (await axios.put(`/api/projects/${project.name}`, project)).data
}

export const deleteProject = async (name: string): Promise<void> => {
  await axios.delete(`/api/projects/${name}`)
}

export const deleteProjectVersion = async (name: string, version: string): Promise<void> => {
  await axios.delete(`/api/projects/${name}/versions/${version}`)
}

export const uploadProjectVersion = async (name: string, version: string, file: File): Promise<void> => {
  const form = new FormData()
  form.append('file', file)
  await axios.post(`/api/projects/${name}/versions/${version}`, form)
}

export const fetchProjectCategories = async (): Promise<ProjectCategory[]> => {
  return (await axios.get(`/api/project_categories/`)).data
}

export const createProjectCategory = async (name: string): Promise<ProjectCategory> => {
  return (await axios.post(`/api/project_categories/`, { name })).data
}

export const renameProjectCategory = async (
  category: Pick<ProjectCategory, 'id' | 'name'>
): Promise<ProjectCategory> => {
  return (await axios.put(`/api/project_categories/${category.id}`, { name: category.name })).data
}

export const reorderProjectCategories = async (categoryIds: number[]): Promise<ProjectCategory[]> => {
  return (await axios.put(`/api/project_categories/order`, { category_ids: categoryIds })).data
}

export const deleteProjectCategory = async (id: number): Promise<void> => {
  await axios.delete(`/api/project_categories/${id}`)
}

export const fetchPluginConfig = async <Type>(name: string): Promise<Type> => {
  return (await axios.get(`/api/plugins/${name}/`)).data
}

export const login = async (username: string, password: string): Promise<void> => {
  await axios.post('/api/auth/login', { username, password })
}

export const logout = async (): Promise<void> => {
  await axios.post('/api/auth/logout')
}

export const fetchCurrentUser = async (): Promise<string> => {
  return (await axios.get('/api/auth/me')).data
}
