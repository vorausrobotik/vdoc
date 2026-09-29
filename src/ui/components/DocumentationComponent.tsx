import { getRouteApi, useLocation, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { IFrameHistoryMode } from '../helpers/IFrame'
import { toReadableHref } from '../helpers/RouteHelpers'
import testIDs from '../interfacesAndTypes/testIDs'
import { DeprecatedVersionBanner } from './DeprecatedVersionBanner'
import IFrame from './IFrame'

const route = getRouteApi('/$projectName/$version/$')
// The resolved version belongs to the project version, not to the page, so it is loaded one route
// up - which is what keeps a page change from re-running that lookup.
const versionRoute = getRouteApi('/$projectName/$version')

export function DocumentationComponent() {
  const location = useLocation()
  const { projectName, _splat } = route.useParams()
  const [resolvedVersion, latestVersion] = versionRoute.useLoaderData()

  const iframeProps = useMemo(
    () => ({
      name: projectName,
      version: resolvedVersion,
      latestVersion: latestVersion,
      page: _splat || '',
      hash: location.hash.startsWith('#') ? location.hash.slice(1) : location.hash,
      search: location.searchStr,
    }),
    [_splat, location.hash, location.searchStr, latestVersion, projectName, resolvedVersion]
  )

  return <DocuIFrame {...iframeProps} />
}

interface DocuIFramePropsI {
  name: string
  version: string
  latestVersion: string
  page: string
  hash: string
  search: string
}

function DocuIFrame(props: DocuIFramePropsI) {
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  /** Where the frame last reported to be, as the address that reaches the file. */
  const [frameHref, setFrameHref] = useState<string | null>(null)

  const iFrameSrc = useMemo(() => {
    const hashSuffix = props.hash.trim() !== '' ? `#${props.hash}` : ''
    return `/static/projects/${props.name}/${props.version}/${props.page}${props.search}${hashSuffix}`
  }, [props.name, props.version, props.page, props.hash, props.search])

  const iframeTitleChanged = (newTitle: string | undefined | null): void => {
    if (newTitle && newTitle !== document.title) {
      document.title = newTitle
    }
  }

  const iFrameNotFound = (): void => {
    setError(new Error("Whoops! This page doesn't seem to exist..."))
  }

  // Kept in a ref rather than in state: `report()` in `IFrame` always sets it before the state
  // updates that trigger the navigation below, and it must not trigger a navigation of its own.
  const historyModeRef = useRef<IFrameHistoryMode>('push')

  const iFrameHistoryModeChanged = (historyMode: IFrameHistoryMode): void => {
    historyModeRef.current = historyMode
  }

  useEffect(() => {
    // Throwing the error in a useEffect to ensure it is caught by the error component of tanstack router.
    if (error) {
      throw error
    }
    if (frameHref === null) {
      return
    }

    // The address bar shows the frame's own address in vdoc's namespace, query and hash included as
    // the frame wrote them: the query belongs to the framed page, and only the page can tell what a
    // repeated or a removed key means.
    const { pathname, search, hash } = new URL(toReadableHref(frameHref))
    router.navigate({
      href: `${pathname}${search}${hash}`,
      // A page the frame reached through client-side navigation already has a session history
      // entry of the frame's own making; adding a second one here would make the back button need
      // two clicks per page.
      replace: historyModeRef.current === 'replace',
    })
  }, [error, frameHref, router])

  return (
    <div data-testid={testIDs.project.documentation.main} style={{ display: 'contents' }}>
      {props.name && props.version !== 'latest' && props.version !== props.latestVersion && (
        <DeprecatedVersionBanner name={props.name} version={props.version} />
      )}
      <IFrame
        src={iFrameSrc}
        onLocationChanged={setFrameHref}
        onTitleChanged={iframeTitleChanged}
        onNotFound={iFrameNotFound}
        onHistoryModeChanged={iFrameHistoryModeChanged}
      />
    </div>
  )
}
