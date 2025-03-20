import axios from 'axios'
import { Project } from '../interfacesAndTypes/Project'
import { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'

export const fetchProjectVersion = async (projectName: string, version: string): Promise<string> => {
  return (await axios.get(`/api/projects/${projectName}/versions/${version}`)).data
}

export const fetchProjectVersions = async (projectName: string): Promise<string[]> => {
  return (await axios.get(`/api/projects/${projectName}/versions/`)).data
}

export const fetchProjects = async (): Promise<Project[]> => {
  return (await axios.get(`/api/projects/`)).data
}

export const fetchLogoURL = async (mode: EffectiveColorMode): Promise<string | null> => {
  return (await axios.get(`/api/settings/logo_url/${mode}`)).data
}
