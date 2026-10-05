import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { IconButton } from '@mui/material'
import { type ReactNode, useState } from 'react'
import {
  Create,
  DataTable,
  DeleteButton,
  Edit,
  List,
  type RaRecord,
  ReferenceManyCount,
  required,
  SaveButton,
  SimpleForm,
  TextInput,
  Toolbar,
  useListContext,
  useNotify,
  useRefresh,
} from 'react-admin'
import { reorderProjectCategories } from '@/helpers/APIFunctions'
import type { ProjectCategory } from '@/interfacesAndTypes/Project'
import { withHttpErrors } from './dataProvider'
import { CategoryChip } from './fields'

// The arrows reorder the categories the list holds, so it holds every one of them on a single page
export const CategoryList = () => (
  <List sort={{ field: 'position', order: 'ASC' }} exporter={false} perPage={1000} pagination={false}>
    <DataTable rowClick="edit" bulkActionButtons={false} size="medium">
      <DataTable.Col
        source="name"
        disableSort
        render={(category: ProjectCategory) => <CategoryChip category={category} />}
      />
      <DataTable.Col label="Projects" disableSort align="right">
        <ReferenceManyCount reference="projects" target="category_id" />
      </DataTable.Col>
      <DataTable.Col
        label="Order"
        disableSort
        align="right"
        render={(category: ProjectCategory & RaRecord) => <MoveButtons category={category} />}
      />
    </DataTable>
  </List>
)

/** Moves a category one place up or down on the landing page. */
function MoveButtons({ category }: { category: ProjectCategory & RaRecord }) {
  const { data = [] } = useListContext<ProjectCategory & RaRecord>()
  const [isPending, setIsPending] = useState(false)
  const notify = useNotify()
  const refresh = useRefresh()
  const index = data.findIndex((candidate) => candidate.id === category.id)

  const move = async (offset: number) => {
    const ids = data.map((candidate) => candidate.id)
    ids.splice(index + offset, 0, ...ids.splice(index, 1))
    setIsPending(true)
    try {
      await withHttpErrors(() => reorderProjectCategories(ids))
      refresh()
    } catch (error) {
      notify((error as Error).message, { type: 'error' })
    } finally {
      setIsPending(false)
    }
  }

  const button = (label: string, offset: number, icon: ReactNode, isAtEnd: boolean) => (
    <IconButton
      size="small"
      aria-label={`${label} ${category.name}`}
      disabled={isPending || isAtEnd}
      onClick={(event) => {
        // The row opens the category's page on a click, which this one is not meant for
        event.stopPropagation()
        move(offset)
      }}
    >
      {icon}
    </IconButton>
  )

  return (
    <>
      {button('Move up', -1, <ArrowUpwardIcon />, index === 0)}
      {button('Move down', 1, <ArrowDownwardIcon />, index === data.length - 1)}
    </>
  )
}

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
