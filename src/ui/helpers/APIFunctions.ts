import axios from 'axios'
import type { Project, ProjectCategory } from '../interfacesAndTypes/Project'

export const fetchProjectVersion = async (projectName: string, version: string): Promise<string> => {
  return (await axios.get(`/api/projects/${projectName}/versions/${version}`)).data
}

export const fetchProjectVersions = async (projectName: string): Promise<string[]> => {
  return (await axios.get(`/api/projects/${projectName}/versions/`)).data
}

export const fetchProjects = async (): Promise<Project[]> => {
  return (await axios.get(`/api/projects/`)).data
}

export const fetchAppVersion = async (): Promise<string> => {
  return (await axios.get('/api/version/')).data
}

export const fetchProjectCategories = async (): Promise<ProjectCategory[]> => {
  return (await axios.get(`/api/project_categories/`)).data
}

export const fetchPluginConfig = async <Type>(name: string): Promise<Type> => {
  return (await axios.get(`/api/plugins/${name}/`)).data
}
