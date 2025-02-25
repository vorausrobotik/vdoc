export interface SanitizeDocUriResI {
  projectName: string
  version: string
  _splat: string
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

  if (!match?.groups) {
    throw new Error(`Unable to sanitize doc URI ${href}`)
  }
  const remainder = match.groups.remainder || ''
  return {
    projectName: projectName,
    version: projectVersion,
    _splat: remainder,
    href: `${basePath}/${projectName}/${projectVersion}${remainder ? `/${remainder}` : ''}`,
  }
}
