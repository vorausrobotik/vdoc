import { isAxiosError } from 'axios'
import { type DataProvider, type GetListParams, HttpError, type Identifier, type RaRecord } from 'react-admin'
import {
  apiErrorMessage,
  createProjectCategory,
  deleteProject,
  deleteProjectCategory,
  fetchProjectCategories,
  fetchProjects,
  renameProjectCategory,
  updateProject,
} from '../helpers/APIFunctions'
import type { Project } from '../interfacesAndTypes/Project'

/** Answers a failed request as react-admin expects it: the message vdoc sent, and the status. */
export async function withHttpErrors<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (isAxiosError(error)) {
      throw new HttpError(apiErrorMessage(error), error.response?.status ?? 0)
    }
    throw error
  }
}

// react-admin keys every record by `id`. A project is keyed by its name, and so is each of its versions.
const fetchProjectRecords = async () =>
  (await fetchProjects({ includeHidden: true })).map((project) => ({
    ...project,
    id: project.name,
    versions: project.versions.map((version) => ({ ...version, id: version.version })),
  }))

const fetchRecords: Record<string, () => Promise<RaRecord[]>> = {
  projects: fetchProjectRecords,
  categories: fetchProjectCategories,
}

/** Searches, sorts and pages a list. The API always answers a list in full, so that happens here. */
export function listPage(records: RaRecord[], { filter, sort, pagination }: GetListParams) {
  const query = String(filter?.q ?? '').toLowerCase()
  const matching = query
    ? records.filter((record) =>
        Object.values(record).some((value) => typeof value === 'string' && value.toLowerCase().includes(query))
      )
    : records
  const sorted = sort
    ? [...matching].sort((a, b) => {
        const order = String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? ''), undefined, {
          numeric: true,
        })
        return sort.order === 'DESC' ? -order : order
      })
    : matching
  const start = pagination ? (pagination.page - 1) * pagination.perPage : 0
  return { data: sorted.slice(start, pagination ? start + pagination.perPage : undefined), total: matching.length }
}

// A URL gives every id as a string, while a category's is a number, so ids are compared as strings
const sameId = (a: Identifier, b: Identifier) => String(a) === String(b)

const unsupported = (action: string, resource: string) =>
  Promise.reject(new HttpError(`Cannot ${action} ${resource} here`, 405))

/**
 * The admin's access to vdoc's API.
 *
 * Cast rather than annotated: react-admin types every method as generic in the record type its caller
 * picks, which a provider that returns the records the API actually sends cannot satisfy.
 */
export const dataProvider = {
  getList: (resource, params) => withHttpErrors(async () => listPage(await fetchRecords[resource](), params)),

  getOne: (resource, { id }) =>
    withHttpErrors(async () => {
      const record = (await fetchRecords[resource]()).find((candidate) => sameId(candidate.id, id))
      if (!record) {
        throw new HttpError(`There is no ${resource} ${id}`, 404)
      }
      return { data: record }
    }),

  getMany: (resource, { ids }) =>
    withHttpErrors(async () => ({
      data: (await fetchRecords[resource]()).filter((record) => ids.some((id) => sameId(record.id, id))),
    })),

  getManyReference: (resource, { target, id, ...params }) =>
    withHttpErrors(async () =>
      listPage(
        (await fetchRecords[resource]()).filter((record) => record[target] === id),
        params
      )
    ),

  create: (resource, { data }) =>
    resource === 'categories'
      ? withHttpErrors(async () => ({ data: await createProjectCategory(data.name) }))
      : unsupported('create', resource),

  update: (resource, { id, data }) => {
    if (resource === 'projects') {
      return withHttpErrors(async () => {
        const saved = await updateProject(data as Project)
        return { data: { ...saved, id } }
      })
    }
    return withHttpErrors(async () => ({ data: await renameProjectCategory({ id: Number(id), name: data.name }) }))
  },

  delete: (resource, { id, previousData }) =>
    withHttpErrors(async () => {
      await (resource === 'projects' ? deleteProject(String(id)) : deleteProjectCategory(Number(id)))
      return { data: previousData }
    }),

  updateMany: (resource) => unsupported('update several', resource),
  deleteMany: (resource) => unsupported('delete several', resource),
} as DataProvider
