import CategoryIcon from '@mui/icons-material/Category'
import FolderIcon from '@mui/icons-material/Folder'
import { useTheme } from '@mui/material'
import { tanStackRouterProvider } from 'ra-router-tanstack'
import {
  Admin,
  Layout,
  type LayoutProps,
  Login,
  LoginForm,
  PasswordInput,
  Resource,
  required,
  TextInput,
} from 'react-admin'
import { projectTitle } from '../helpers/Projects'
import type { Project } from '../interfacesAndTypes/Project'
import { authProvider } from './authProvider'
import { CategoryCreate, CategoryEdit, CategoryList } from './categories'
import { dataProvider } from './dataProvider'
import { ProjectEdit, ProjectList } from './projects'

// Always shown, rather than hidden while scrolling down, so the page title and the logout stay in reach
const AdminLayout = (props: LayoutProps) => <Layout {...props} appBarAlwaysOn />

// On vdoc's background, and with the inputs as wide as the form, which react-admin's own theme would set
const AdminLogin = () => (
  <Login sx={{ backgroundImage: 'none', bgcolor: 'background.default' }}>
    <LoginForm>
      <TextInput source="username" autoComplete="username" validate={required()} autoFocus fullWidth />
      <PasswordInput source="password" autoComplete="current-password" validate={required()} fullWidth size="medium" />
    </LoginForm>
  </Login>
)

/**
 * The admin pages: react-admin in vdoc's router and theme, but with its own layout rather than
 * vdoc's app bar and footer.
 *
 * A further section is a further `Resource`. Projects are only listed and edited here: one comes
 * into existence by uploading its first version.
 */
export function AdminApp() {
  // vdoc's theme, so the admin pages look like the rest of vdoc and follow its color mode
  const theme = useTheme()
  return (
    <Admin
      theme={theme}
      layout={AdminLayout}
      loginPage={AdminLogin}
      basename="/admin"
      routerProvider={tanStackRouterProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      requireAuth
      disableTelemetry
      title="vdoc admin"
    >
      <Resource
        name="projects"
        list={ProjectList}
        edit={ProjectEdit}
        icon={FolderIcon}
        recordRepresentation={(project: Project) => projectTitle(project)}
      />
      <Resource
        name="categories"
        list={CategoryList}
        create={CategoryCreate}
        edit={CategoryEdit}
        icon={CategoryIcon}
        recordRepresentation="name"
      />
    </Admin>
  )
}
