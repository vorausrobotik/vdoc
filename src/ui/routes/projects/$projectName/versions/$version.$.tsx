import { useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { Link, useRouter } from '@tanstack/react-router'
import { useTheme, Typography, Grid2 } from '@mui/material'
import { useStore } from '@tanstack/react-store'
import { sanitizeDocuUri } from '../../../../helpers/RouteHelpers'
import { fetchProjectVersion, fetchProjectVersions } from '../../../../helpers/APIFunctions'
import globalStore from '../../../../helpers/GlobalStore'

export const Route = createFileRoute('/projects/$projectName/versions/$version/$')({
  component: DocumentationComponent,
})

function DocumentationComponent() {
  const { projectName, version, _splat } = Route.useParams()
  const theme = useTheme()
  const router = useRouter()
  const latestVersion = useStore(globalStore, (state) => state['latestVersion'])
  const displayVersion = version === 'latest' ? latestVersion : version
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleIframe = useCallback(() => {
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
  }, [router])

  useEffect(() => {
    const unsubscribe = router.subscribe('onResolved', () => {
      handleIframe()
    })
    const fetchData = async () => {
      const [versions, latestVersion] = await Promise.all([
        fetchProjectVersions(projectName),
        fetchProjectVersion(projectName, 'latest'),
      ])

      globalStore.setState((state) => ({
        ...state,
        projectName,
        projectVersions: versions,
        currentVersion: version,
        latestVersion,
      }))
    }

    fetchData()
    return () => unsubscribe() // Cleanup on unmount
  }, [projectName, version, router, handleIframe])

  const deprecatedVersionBanner = () => {
    return (
      <Link
        to="/projects/$projectName/versions/$version/$"
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
    )
  }

  return (
    <Fragment>
      {projectName && displayVersion !== latestVersion && deprecatedVersionBanner()}
      <iframe
        ref={iframeRef}
        onLoad={handleIframe}
        style={{ border: 0, width: '100%', height: '100%' }}
        src={`/projects/${projectName}/${displayVersion}/${_splat}${window.location.hash}`}
      />
    </Fragment>
  )
}
