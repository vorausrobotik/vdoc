/** Search parameters as vdoc's router holds them: a repeated key keeps all of its values. */
type Search = Record<string, string | string[]>

/**
 * The search parameters of `searchStr`, for vdoc's router.
 *
 * The query of a documentation page belongs to the framed page and has to reach it unchanged, which
 * the router's default does not do: it reads a value as JSON and keeps only one value per key. A
 * search plugin that writes `?_highlight=robot&_highlight=ui` and reads it back with `getAll` would
 * then find a single word. Every value stays a string here, and a repeated key keeps all of its
 * values, in order. {@link stringifySearch} is the inverse.
 */
export function parseSearch(searchStr: string): Search {
  const search: Search = {}
  for (const [key, value] of new URLSearchParams(searchStr)) {
    const previous = search[key]
    search[key] = previous === undefined ? value : [previous, value].flat()
  }
  return search
}

/**
 * The query string of `search`, with the leading `?`, or an empty string if there is none.
 *
 * The inverse of {@link parseSearch}. Values of a repeated key come out next to each other, so a
 * query that interleaves keys comes back in another order, with the same meaning.
 */
export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    for (const item of [value].flat()) {
      if (item !== undefined) {
        params.append(key, String(item))
      }
    }
  }
  const searchStr = params.toString()
  return searchStr ? `?${searchStr}` : ''
}
