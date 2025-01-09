import { Store } from '@tanstack/store'
import { IGlobalStore } from '../interfacesAndTypes/Store'

export const globalStore = new Store<IGlobalStore>({
  projectVersions: null,
  currentVersion: 'latest',
})

export default globalStore
