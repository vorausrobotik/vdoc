import type { AuthProvider } from 'react-admin'
import { fetchCurrentUser, login, logout } from '@/helpers/APIFunctions'
import { withHttpErrors } from './dataProvider'

/** Logs in with a session cookie that vdoc sets, so the password never stays in the browser. */
export const authProvider: AuthProvider = {
  login: ({ username, password }) => withHttpErrors(() => login(username, password)),
  // react-admin logs out before it shows the login page, so a logout that fails must not stop it there
  logout: () => logout().catch(() => undefined),
  checkAuth: () => withHttpErrors(async () => void (await fetchCurrentUser())),
  checkError: (error) => (error?.status === 401 ? Promise.reject() : Promise.resolve()),
  getIdentity: () =>
    withHttpErrors(async () => {
      const name = await fetchCurrentUser()
      return { id: name, fullName: name }
    }),
}
