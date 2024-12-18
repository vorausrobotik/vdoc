export function groupVersionsByMajorVersion(versions: string[]): Record<number, string[]> {
  const grouped: Record<number, string[]> = {}

  versions.forEach((version) => {
    const [major] = version.split('.').map(Number)
    if (!grouped[major]) {
      grouped[major] = []
    }
    grouped[major].push(version)
  })

  return grouped
}
