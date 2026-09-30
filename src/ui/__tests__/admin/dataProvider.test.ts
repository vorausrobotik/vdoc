import { describe, expect, test } from 'vitest'
import { listPage } from '../../admin/dataProvider'

const records = [
  { id: 'b', name: 'beta', display_name: 'Second' },
  { id: 'a10', name: 'alpha-10', display_name: null },
  { id: 'a2', name: 'alpha-2', display_name: 'First' },
]

const names = (page: ReturnType<typeof listPage>) => page.data.map((record) => record.name)

describe('listPage', () => {
  test('returns everything unfiltered, unsorted and unpaged when asked for nothing', () => {
    expect(listPage(records, {})).toEqual({ data: records, total: 3 })
  })

  test('searches every text field, ignoring case', () => {
    expect(names(listPage(records, { filter: { q: 'FIRST' } }))).toEqual(['alpha-2'])
    expect(names(listPage(records, { filter: { q: 'alpha' } }))).toEqual(['alpha-10', 'alpha-2'])
  })

  test('sorts numbers inside names by their value, in either direction', () => {
    expect(names(listPage(records, { sort: { field: 'name', order: 'ASC' } }))).toEqual(['alpha-2', 'alpha-10', 'beta'])
    expect(names(listPage(records, { sort: { field: 'name', order: 'DESC' } }))).toEqual([
      'beta',
      'alpha-10',
      'alpha-2',
    ])
  })

  test('sorts a missing value first', () => {
    expect(names(listPage(records, { sort: { field: 'display_name', order: 'ASC' } }))).toEqual([
      'alpha-10',
      'alpha-2',
      'beta',
    ])
  })

  test('pages after searching and sorting, and counts every match', () => {
    const page = listPage(records, {
      filter: { q: 'a' },
      sort: { field: 'name', order: 'ASC' },
      pagination: { page: 2, perPage: 2 },
    })
    expect(names(page)).toEqual(['beta'])
    expect(page.total).toBe(3)
  })
})
