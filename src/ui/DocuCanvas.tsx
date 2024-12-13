import Grid from '@mui/material/Grid2'
import { Fragment } from 'react/jsx-runtime'
import { Link } from '@tanstack/react-router'
import useTheme from '@mui/material/styles/useTheme'
import Typography from '@mui/material/Typography'

interface DocuCanvasProps extends React.ComponentProps<'iframe'> {
  name: string
  version: string
  latestVersion: string
}

function DocuCanvas(props: DocuCanvasProps) {
  const theme = useTheme()
  const baseUrl = `http://localhost:8080/projects/${props.name}/`
  return (
    <Fragment>
      {props.version !== props.latestVersion && (
        <Link
          to="/$projectName/versions/$version"
          params={{ projectName: props.name, version: 'latest' }}
          style={{ textDecoration: 'none' }}
        >
          <Grid
            container
            direction="row"
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.palette.warning.main,
            }}
          >
            <Typography variant="body1" color="black">
              You're currently reading an <b>old version</b> ({props.version}) of {props.name}! To view the latest
              version of the documentation, click this banner.
            </Typography>
          </Grid>
        </Link>
      )}
      <iframe style={{ border: 0, width: '100%', height: '100%' }} src={`${baseUrl}/${props.version}`} />
    </Fragment>
  )
}

export default DocuCanvas
