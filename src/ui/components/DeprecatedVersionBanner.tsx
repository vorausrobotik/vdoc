import { Link } from '@tanstack/react-router'
import { useTheme, Typography, Grid2 } from '@mui/material'
import testIDs from '../interfacesAndTypes/testIDs'

interface DeprecatedVersionBannerPropsI {
  name: string
  version: string
}
export const DeprecatedVersionBanner = ({ name, version }: DeprecatedVersionBannerPropsI) => {
  const theme = useTheme()
  return (
    <Link
      to="/$projectName/$version/$"
      params={{ projectName: name, version: 'latest' }}
      style={{ textDecoration: 'none' }}
      data-testid={testIDs.project.documentation.latestVersionWarningBanner}
    >
      <Grid2
        container
        direction="row"
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.warning.main,
        }}
      >
        <Typography variant="body1" color="black">
          You're currently reading an <b>old version</b> ({version}) of {name}! To view the latest version of the
          documentation, click this banner.
        </Typography>
      </Grid2>
    </Link>
  )
}

export default DeprecatedVersionBanner
