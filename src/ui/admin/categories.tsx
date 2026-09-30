import {
  Create,
  DataTable,
  DeleteButton,
  Edit,
  List,
  ReferenceManyCount,
  required,
  SaveButton,
  SimpleForm,
  TextInput,
  Toolbar,
} from 'react-admin'
import type { ProjectCategory } from '../interfacesAndTypes/Project'
import { CategoryChip } from './fields'

export const CategoryList = () => (
  <List sort={{ field: 'name', order: 'ASC' }} exporter={false} perPage={25}>
    <DataTable rowClick="edit" bulkActionButtons={false} size="medium">
      <DataTable.Col source="name" render={(category: ProjectCategory) => <CategoryChip category={category} />} />
      <DataTable.Col label="Projects" disableSort align="right">
        <ReferenceManyCount reference="projects" target="category_id" />
      </DataTable.Col>
    </DataTable>
  </List>
)

const CategoryEditToolbar = () => (
  <Toolbar sx={{ justifyContent: 'space-between' }}>
    <SaveButton />
    <DeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete the category?"
      confirmContent="Its projects move to Misc."
    />
  </Toolbar>
)

export const CategoryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<CategoryEditToolbar />}>
      <TextInput source="name" validate={required()} />
    </SimpleForm>
  </Edit>
)

export const CategoryCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <TextInput source="name" validate={required()} />
    </SimpleForm>
  </Create>
)
