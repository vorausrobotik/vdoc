import { useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { Link, useRouter } from '@tanstack/react-router'
import { useTheme, Typography, Grid2 } from '@mui/material'
import { useStore } from '@tanstack/react-store'
import globalStore from './helpers/GlobalStore'
import { sanitizeDocuUri } from './helpers/RouteHelpers'

interface DocuCanvasProps extends React.ComponentProps<'div'> {
  remainingPath?: string
}

function DocuCanvas(props: DocuCanvasProps) {
  const theme = useTheme()
  const router = useRouter()
  const projectName = useStore(globalStore, (state) => state['projectName'])
  const version = useStore(globalStore, (state) => state['currentVersion'])
  const latestVersion = useStore(globalStore, (state) => state['latestVersion'])
  const displayVersion = version === 'latest' ? latestVersion : version
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function handleIframe() {
    if (iframeRef.current) {
      const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      const currentOrigin = window.location.origin
      if (iframeDocument) {
        const anchorElements = iframeDocument.querySelectorAll('a')
        anchorElements.forEach((anchor) => {
          const href = anchor.getAttribute('href')
          if (href && href.startsWith(currentOrigin)) {
            const sanitizedPath = sanitizeDocuUri(href, currentOrigin)
            console.log(`Sanitized path ${href} to ${sanitizedPath}`)
            anchor.addEventListener('click', (event) => {
              // Intercept anchor click and use tanstack router navigation
              event.preventDefault()
              router.navigate({ to: sanitizedPath })
            })
          }
        })
      }
    }
  }
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
      <iframe
        ref={iframeRef}
        onLoad={handleIframe}
        style={{ border: 0, width: '100%', height: '100%' }}
        src={`/projects/${projectName}/${displayVersion}/${props.remainingPath}${window.location.hash}`}
      />
    </Fragment>
  )
}

export default DocuCanvas
