export interface SanitizeDocUriResI {
  project?: string
  version?: string
  remainder?: string
  isInternal: boolean
  href: string
}
export const sanitizeDocuUri = (
  href: string,
  basePath: string,
  projectName: string,
  projectVersion: string
): SanitizeDocUriResI => {
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
    const url = new URL(`${name}/${version}${remainder ? `/${remainder}` : ''}`, basePath)
    return { project: name, version, remainder, isInternal: true, href: url.href }
  } else if (!href.startsWith('http')) {
    const url = new URL(`${projectName}/${projectVersion}/${href}`, basePath)
    return { remainder: href, isInternal: true, href: url.href }
  } else {
    return { isInternal: false, href: href }
  }
}
