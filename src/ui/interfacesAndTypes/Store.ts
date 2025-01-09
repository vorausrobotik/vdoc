export interface IGlobalStore {
  projectName: string | null
  projectVersions: string[] | null
  currentVersion: string | null
  latestVersion: string | null
}
