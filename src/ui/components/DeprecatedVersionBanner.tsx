import { Alert } from '@mui/material'
import { Link } from '@tanstack/react-router'
import testIDs from '@/interfacesAndTypes/testIDs'

interface DeprecatedVersionBannerPropsI {
  name: string
  version: string
}
export const DeprecatedVersionBanner = ({ name, version }: DeprecatedVersionBannerPropsI) => (
  <Link
    to="/$projectName/$version/$"
    params={{ projectName: name, version: 'latest' }}
    style={{ textDecoration: 'none' }}
    data-testid={testIDs.project.documentation.latestVersionWarningBanner}
  >
    <Alert severity="warning" sx={{ justifyContent: 'center' }}>
      You're currently reading an <b>old version</b> ({version}) of {name}! To view the latest version of the
      documentation, click this banner.
    </Alert>
  </Link>
)
