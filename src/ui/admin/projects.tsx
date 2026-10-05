import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import UploadIcon from '@mui/icons-material/Upload'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button as MuiButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import {
  ArrayField,
  AutocompleteInput,
  Button,
  Confirm,
  DataTable,
  DateField,
  DeleteButton,
  Edit,
  FileField,
  FileInput,
  Form,
  FunctionField,
  List,
  ReferenceField,
  ReferenceInput,
  required,
  SaveButton,
  SearchInput,
  SelectInput,
  SimpleForm,
  TextInput,
  Toolbar,
  useCreate,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
} from 'react-admin'
import { deleteProjectVersion, uploadProjectVersion } from '@/helpers/APIFunctions'
import type { Project, ProjectCategory, ProjectVersion } from '@/interfacesAndTypes/Project'
import { withHttpErrors } from './dataProvider'
import { CategoryChip, CategoryOption, VisibilityChip, VisibilityOption } from './fields'
import { VISIBILITY_CHOICES } from './visibility'

const latestVersion = (project: Project) => project.versions[project.versions.length - 1]

export const ProjectList = () => (
  <List
    filters={[<SearchInput key="q" source="q" alwaysOn />]}
    sort={{ field: 'name', order: 'ASC' }}
    exporter={false}
    perPage={25}
  >
    <DataTable rowClick="edit" bulkActionButtons={false} size="medium">
      <DataTable.Col source="name" label="Project" />
      <DataTable.Col source="display_name" label="Display name" />
      <DataTable.Col
        source="description"
        disableSort
        render={(project: Project) => (
          <Tooltip title={project.description ?? ''}>
            {/* One line, so a long description does not stretch its row */}
            <Typography variant="body2" noWrap sx={{ maxWidth: 320 }}>
              {project.description}
            </Typography>
          </Tooltip>
        )}
      />
      <DataTable.Col source="category_id" label="Category">
        <ReferenceField source="category_id" reference="categories" link={false} empty={<CategoryChip />}>
          <FunctionField render={(category: ProjectCategory) => <CategoryChip category={category} />} />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col
        source="visibility"
        render={(project: Project) => <VisibilityChip visibility={project.visibility} />}
      />
      <DataTable.Col
        label="Versions"
        disableSort
        render={(project: Project) => project.versions.length}
        align="right"
      />
      <DataTable.Col label="Latest" disableSort render={(project: Project) => latestVersion(project)?.version} />
    </DataTable>
  </List>
)

/** Picks the category by searching for it, and creates it from what was typed if it does not exist. */
function CategoryInput() {
  const [create] = useCreate()
  return (
    <ReferenceInput source="category_id" reference="categories" sort={{ field: 'name', order: 'ASC' }}>
      <AutocompleteInput
        fullWidth
        label="Category"
        optionText={<CategoryOption />}
        inputText={(category: ProjectCategory) => category.name}
        matchSuggestion={(filter: string, category: ProjectCategory) =>
          category.name.toLowerCase().includes(filter.toLowerCase())
        }
        TextFieldProps={{ placeholder: 'Misc' }}
        helperText="Empty shows the project under Misc."
        onCreate={(name?: string) => create('categories', { data: { name } }, { returnPromise: true })}
        createItemLabel={(name: string) => `Add "${name}"`}
      />
    </ReferenceInput>
  )
}

function DeleteVersionButton({ project, version }: { project: Project; version: ProjectVersion }) {
  const [confirming, setConfirming] = useState(false)
  const notify = useNotify()
  const refresh = useRefresh()
  const redirect = useRedirect()
  const isLast = project.versions.length === 1

  const handleConfirm = async () => {
    setConfirming(false)
    try {
      await withHttpErrors(() => deleteProjectVersion(project.name, version.version))
      notify(`Version ${version.version} deleted`, { type: 'info' })
      if (isLast) {
        redirect('list', 'projects')
      } else {
        refresh()
      }
    } catch (error) {
      notify((error as Error).message, { type: 'error' })
    }
  }

  return (
    <>
      <Button label="Delete" color="error" onClick={() => setConfirming(true)}>
        <DeleteIcon />
      </Button>
      <Confirm
        isOpen={confirming}
        title={`Delete version ${version.version}?`}
        content={
          isLast
            ? 'This is the only version, so the project is deleted with it, together with how it is presented.'
            : 'Its files are deleted, and it disappears from the version picker.'
        }
        onConfirm={handleConfirm}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}

function UploadVersionButton({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const notify = useNotify()
  const refresh = useRefresh()

  const handleSubmit = async (values: Record<string, unknown>) => {
    const { version, file } = values as { version: string; file: { rawFile: File } }
    try {
      await withHttpErrors(() => uploadProjectVersion(project.name, version, file.rawFile))
      notify(`Version ${version} uploaded`, { type: 'info' })
      setOpen(false)
      refresh()
    } catch (error) {
      notify((error as Error).message, { type: 'error' })
    }
  }

  return (
    <>
      <Button label="Upload version" onClick={() => setOpen(true)}>
        <UploadIcon />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <Form onSubmit={handleSubmit}>
          <DialogTitle>Upload a version of {project.name}</DialogTitle>
          <DialogContent>
            <TextInput source="version" validate={required()} fullWidth helperText="Such as 1.0.0" />
            <FileInput
              source="file"
              accept={{ 'application/zip': ['.zip'] }}
              validate={required()}
              helperText="A ZIP archive with an index.html at its root."
            >
              <FileField source="src" title="title" />
            </FileInput>
          </DialogContent>
          <DialogActions>
            <Button label="Cancel" onClick={() => setOpen(false)} />
            <SaveButton label="Upload" icon={<UploadIcon />} />
          </DialogActions>
        </Form>
      </Dialog>
    </>
  )
}

function Versions() {
  const project = useRecordContext<Project>()
  if (!project) {
    return null
  }
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Versions</Typography>
        <UploadVersionButton project={project} />
      </Box>
      <ArrayField source="versions" sort={{ field: 'published_at', order: 'DESC' }}>
        <DataTable bulkActionButtons={false} rowClick={false} size="medium">
          <DataTable.Col source="version" disableSort />
          <DataTable.Col source="published_at" label="Published" disableSort>
            <DateField source="published_at" showTime />
          </DataTable.Col>
          <DataTable.Col
            label=""
            align="right"
            render={(version: ProjectVersion) => (
              <>
                <MuiButton
                  size="small"
                  href={`/${project.name}/${version.version}/`}
                  target="_blank"
                  startIcon={<OpenInNewIcon />}
                >
                  Open
                </MuiButton>
                <DeleteVersionButton project={project} version={version} />
              </>
            )}
          />
        </DataTable>
      </ArrayField>
    </Box>
  )
}

const ProjectEditToolbar = () => (
  <Toolbar sx={{ justifyContent: 'space-between' }}>
    <SaveButton />
    <DeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete the project?"
      confirmContent="Every version and all their files are deleted. To take the project offline without deleting it, lock it."
    />
  </Toolbar>
)

export const ProjectEdit = () => (
  <Edit mutationMode="pessimistic">
    {/* Spaced, because the outlined labels of vdoc's theme otherwise run into the helper text above */}
    <SimpleForm toolbar={<ProjectEditToolbar />} sx={{ maxWidth: 800, '& .ra-input': { mb: 1.5 } }}>
      <TextInput
        source="display_name"
        fullWidth
        helperText="Shown instead of the project name. Left empty, the project name is shown."
      />
      <TextInput
        source="description"
        fullWidth
        multiline
        minRows={3}
        helperText="Shown on the project's card on the landing page."
      />
      <CategoryInput />
      <SelectInput
        source="visibility"
        choices={VISIBILITY_CHOICES}
        optionText={<VisibilityOption />}
        validate={required()}
        fullWidth
      />
    </SimpleForm>
    <Versions />
  </Edit>
)
