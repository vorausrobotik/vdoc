export interface SanitizeDocUriResI {
  project?: string
  version?: string
  remainder?: string
  isInternal: boolean
}
export const sanitizeDocuUri = (href: string, basePath: string): SanitizeDocUriResI => {
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&')
  }

  const escapedBasePath = escapeRegExp(basePath)

  const re = new RegExp(
    String.raw`^${escapedBasePath}(?:\/static)?(?:\/projects)?\/(?<name>[^\/]+)\/(?<version>[^\/#?\n]+)(?:\/(?<remainder>.*?))?(?:\n|$)`
  )
  const match = href.match(re)
  if (match && match.groups) {
    const { name, version, remainder } = match.groups
    return { project: name, version, remainder, isInternal: true }
  } else if (!href.startsWith('http')) {
    return { remainder: href, isInternal: true }
  } else {
    return { isInternal: false }
  }
}
