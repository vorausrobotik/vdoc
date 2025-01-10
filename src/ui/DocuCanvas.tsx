import { useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { Link, useRouter } from '@tanstack/react-router'
import { useTheme, Typography, Grid2 } from '@mui/material'
import { useStore } from '@tanstack/react-store'
import globalStore from './helpers/GlobalStore'

function DocuCanvas() {
  const theme = useTheme()
  const projectName = useStore(globalStore, (state) => state['projectName'])
  const version = useStore(globalStore, (state) => state['currentVersion'])
  const latestVersion = useStore(globalStore, (state) => state['latestVersion'])
  const displayVersion = version === 'latest' ? latestVersion : version
  return (
    <Fragment>
      {projectName && displayVersion !== latestVersion && (
        <Link
          to="/projects/$projectName/versions/$version"
          params={{ projectName: projectName, version: 'latest' }}
          style={{ textDecoration: 'none' }}
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
              You're currently reading an <b>old version</b> ({version}) of {projectName}! To view the latest version of
              the documentation, click this banner.
            </Typography>
          </Grid2>
        </Link>
      )}
      <iframe style={{ border: 0, width: '100%', height: '100%' }} src={`/projects/${projectName}/${displayVersion}`} />
    </Fragment>
  )
}

export default DocuCanvas
