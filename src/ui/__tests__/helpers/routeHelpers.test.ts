import { describe, expect, test } from 'vitest'
import { parseSearch, stringifySearch } from '@/helpers/RouteHelpers'

describe('parseSearch and stringifySearch', () => {
  test.each([
    { description: 'an empty query', search: '' },
    { description: 'a single parameter', search: '?tab=examples' },
    { description: 'a repeated key, in order', search: '?_highlight=alpha&_highlight=beta' },
    { description: 'a repeated key among other parameters', search: '?q=search&_highlight=alpha&_highlight=beta' },
    { description: 'a value that reads as JSON', search: '?page=1&flag=true' },
  ])('round-trip $description unchanged', ({ search }) => {
    expect(stringifySearch(parseSearch(search))).toBe(search)
  })

  test('keeps every value of a repeated key', () => {
    expect(parseSearch('?_highlight=alpha&_highlight=beta')).toStrictEqual({ _highlight: ['alpha', 'beta'] })
  })

  test('keeps a value that reads as JSON a string', () => {
    expect(parseSearch('?page=1')).toStrictEqual({ page: '1' })
  })
})
