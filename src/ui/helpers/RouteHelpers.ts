export interface SanitizeDocUriResI {
  projectName: string
  version: string
  _splat: string
  href: string
}
export const sanitizeDocuUri = (href: string, overrideName?: string, overrideVersion?: string): SanitizeDocUriResI => {
  href = href.replace('static/projects/', '')
  try {
    const url = new URL(href, 'http://dummy-base') // Add dummy base in case href is relative
    const pathnameParts = url.pathname.split('/').filter(Boolean)

    if (pathnameParts.length < 2) {
      throw new Error(`Invalid path structure in '${href}'`)
    }

    const [name, version, ...remainderParts] = pathnameParts
    let remainder = remainderParts.join('/')

    if (url.search || url.hash) {
      remainder += `${url.search}${url.hash}`
    }

    const basePathPrefix = ['http://', 'https://'].some((word) => href.startsWith(word)) ? url.origin : undefined
    const _name = overrideName || name
    const _version = overrideVersion || version

    return {
      projectName: _name,
      version: _version,
      _splat: remainder,
      href: [basePathPrefix, _name, _version, remainder].filter(Boolean).join('/'),
    }
  } catch {
    throw new Error(`Unable to match URI '${href}'`)
  }
}
