import { Store } from '@tanstack/store'
import { IGlobalStore } from '../interfacesAndTypes/Store'

export const globalStore = new Store<IGlobalStore>({
  projectName: null,
  projectVersions: null,
  currentVersion: null,
  latestVersion: null,
})

export default globalStore
