export const sanitizeDocuUri = (uri: string, basePath: string): string => {
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&')
  }

  const escapedBasePath = escapeRegExp(basePath)

  const re = new RegExp(
    String.raw`^${escapedBasePath}(\/app)?\/projects\/(?<name>[^\/]+)(\/versions)?\/(?<version>[^\/]+)(?:\/)?(?<remainder>[^$]+)?$`
  )

  const match = uri.match(re)
  if (match && match.groups) {
    const { name, version, remainder } = match.groups
    return `/app/projects/${name}/versions/${version}/${remainder}`
  }

  throw new Error(`Unable to parse docu URI ${uri}`)
}
