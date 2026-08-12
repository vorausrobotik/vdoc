import type { EffectiveColorMode } from '../interfacesAndTypes/ColorModes'

/**
 * Path prefix under which vdoc serves the published documentation files themselves.
 *
 * The files need a namespace of their own because relative links inside a framed page resolve
 * against the page's own address: without the prefix, a click inside the frame would load vdoc's
 * application into the frame instead of the next documentation page.
 */
export const FRAME_PATH_PREFIX = '/static/projects/'

/**
 * Query parameter vdoc appends to the frame URL to request a color mode.
 *
 * See `docs/frame_contract.md`. It is vdoc's request to the frame, never part of a page's address,
 * which is why {@link normalizeIFrameSrc} and `parseIFrameHref` both drop it again.
 */
export const VDOC_THEME_PARAM = 'vdoc-theme'

/**
 * `pathname` with the frame path prefix removed, if it carries one.
 *
 * The one place that knows how the two namespaces map onto each other. Anchored at the start of
 * the path rather than replacing the prefix wherever it appears, so that a path segment or query
 * value that happens to spell it out is left alone.
 */
export function stripFramePrefix(pathname: string): string {
  return pathname.startsWith(FRAME_PATH_PREFIX) ? `/${pathname.slice(FRAME_PATH_PREFIX.length)}` : pathname
}

/**
 * The readable form of `href`: the address vdoc's own router answers for the same page.
 *
 * The same page has two addresses - the file under {@link FRAME_PATH_PREFIX} and vdoc's own
 * `/{project}/{version}/...` - and mapping between them is a pure function in both directions,
 * with {@link toFrameHref} as the inverse. Nothing has to be remembered per link.
 *
 * Foreign addresses are returned verbatim, addresses of vdoc's own origin absolute, and applying
 * this to an address that is already readable changes nothing.
 *
 * {@link VDOC_THEME_PARAM} is dropped, because the readable form is an address in vdoc's own
 * namespace and vdoc's request to the frame has no meaning there. It has to be dropped explicitly:
 * a fragment-only link resolves against the whole address of the document it sits in, so every
 * `<a href="#section">` in a framed page would otherwise display and copy vdoc's parameter.
 *
 * @param href The address to convert, absolute or relative to `origin`.
 * @param origin The origin vdoc is served from.
 */
export function toReadableHref(href: string, origin: string = window.location.origin): string {
  const url = new URL(href, origin)
  if (url.origin !== origin) {
    return href
  }
  url.searchParams.delete(VDOC_THEME_PARAM)
  url.pathname = stripFramePrefix(url.pathname)
  return url.href
}

/**
 * The frame form of `href`: the address that reaches the documentation file itself.
 *
 * The inverse of {@link toReadableHref}, and idempotent for the same reason: this runs while a
 * click is being handled, and what the anchor carries at that moment is not certain. A framework
 * that re-renders a link restores the address the documentation authored, so the same link can
 * arrive in either form and must end up at the same file either way.
 *
 * @param href The address to convert, absolute or relative to `origin`.
 * @param origin The origin vdoc is served from.
 */
export function toFrameHref(href: string, origin: string = window.location.origin): string {
  const url = new URL(href, origin)
  if (url.origin !== origin) {
    return href
  }
  if (!url.pathname.startsWith(FRAME_PATH_PREFIX)) {
    url.pathname = `${FRAME_PATH_PREFIX}${url.pathname.replace(/^\//, '')}`
  }
  return url.href
}

/**
 * The identity of an iframe URL: what makes two addresses the same page for vdoc's purposes.
 *
 * This is the single string used to answer "is the frame already showing this?". Both the address
 * vdoc wants and the one the frame reports after navigating itself are reduced with this function,
 * so that a client-side navigation cannot be mistaken for a stale source - which would force-load
 * the frame and undo that very navigation. Composing the two sides differently is the mistake this
 * function exists to prevent.
 *
 * Two differences are deliberately not differences here:
 *
 * - {@link VDOC_THEME_PARAM}, which belongs to the URL that gets loaded but never to the
 *   comparison, or changing the color mode would reload every frame - including the ones that
 *   apply it in place, instantly and without a reload.
 * - A trailing slash. A generator that publishes a page as a directory is reached through a
 *   redirect that adds one, while vdoc's router normalizes it away again; treating the two forms
 *   as different pages reloads the frame for as long as it is open.
 */
export function normalizeIFrameSrc(src: string, origin: string = window.location.origin): string {
  const url = new URL(src, origin)
  url.searchParams.delete(VDOC_THEME_PARAM)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1)
  }
  return url.href
}

/**
 * The URL to load the frame with: `src` carrying the requested color mode as
 * {@link VDOC_THEME_PARAM}.
 *
 * Composed through `URLSearchParams` rather than by string concatenation, because `src` may
 * already carry a query string or a hash. The path is left exactly as given, unlike in
 * {@link normalizeIFrameSrc} - what may be ignored when comparing two addresses must still be
 * requested faithfully.
 */
export function composeIFrameSrc(src: string, mode: EffectiveColorMode, origin?: string): string {
  const url = new URL(src, origin ?? window.location.origin)
  url.searchParams.set(VDOC_THEME_PARAM, mode)
  return url.href
}

export interface SanitizeDocUriResI {
  projectName: string
  version: string
  _splat: string
  href: string
}

/**
 * Decompose a documentation address into the parameters vdoc's router works with.
 *
 * Its `href` looks like what {@link toReadableHref} returns, and on ordinary page addresses the two
 * agree - but they are deliberately not the same function, because they answer to opposite
 * requirements. This one derives router parameters, so it normalizes the address: an empty fragment
 * and a trailing slash are noise here and are dropped, and an address that is not a documentation
 * page is an error rather than a value. {@link toReadableHref} writes into the `href` of a link in a
 * framed document, so it must preserve the address exactly - an empty fragment included - and hand
 * back anything it does not recognize untouched rather than throw.
 *
 * What the two do share is {@link stripFramePrefix}, which is the whole of the mapping between the
 * two namespaces.
 *
 * @param href The address to decompose, absolute or relative.
 * @param overrideName Project name to report instead of the one in `href`.
 * @param overrideVersion Version to report instead of the one in `href`.
 */
export const sanitizeDocuUri = (href: string, overrideName?: string, overrideVersion?: string): SanitizeDocUriResI => {
  try {
    const url = new URL(href, 'http://dummy-base') // Add dummy base in case href is relative
    const pathnameParts = stripFramePrefix(url.pathname).split('/').filter(Boolean)

    if (pathnameParts.length < 2) {
      throw new Error(`Invalid path structure in '${href}'`)
    }

    const [name, version, ...remainderParts] = pathnameParts
    let remainder = remainderParts.join('/')

    if (url.search || url.hash) {
      remainder += `${url.search}${url.hash}`
    }

    const basePathPrefix = ['http://', 'https://'].some((word) => href.startsWith(word)) ? url.origin : undefined
    const _name = overrideName || name
    const _version = overrideVersion || version

    return {
      projectName: _name,
      version: _version,
      _splat: remainder,
      href: [basePathPrefix, _name, _version, remainder].filter(Boolean).join('/'),
    }
  } catch {
    throw new Error(`Unable to match URI '${href}'`)
  }
}
