import type { EffectiveColorMode } from '@/interfacesAndTypes/ColorModes'

/**
 * Path prefix under which vdoc serves the published documentation files themselves.
 *
 * The files need a namespace of their own because relative links inside a framed page resolve
 * against the page's own address: without the prefix, a click inside the frame would load vdoc's
 * application into the frame instead of the next documentation page.
 */
export const FRAME_PATH_PREFIX = '/static/projects/'

/** Query parameter vdoc appends to the frame URL to request a color mode. */
export const VDOC_THEME_PARAM = 'vdoc-theme'

/**
 * Query parameter vdoc appends to tell the frame where its own content starts horizontally.
 *
 * Sent as a parameter rather than written down as a constant because vdoc keeps every published
 * version forever: a number baked into a site's stylesheet at build time would strand every site
 * published before vdoc next changed its own gutter.
 */
export const VDOC_INSET_PARAM = 'vdoc-inset'

/** Every parameter vdoc adds to the frame URL for the frame's own benefit, never part of an address. */
const VDOC_FRAME_PARAMS: readonly string[] = [VDOC_THEME_PARAM, VDOC_INSET_PARAM]

/** What vdoc tells the frame about itself, on the URL it loads it with. */
export interface FrameParams {
  /** The color mode the frame should apply, always resolved - never `system`. */
  mode: EffectiveColorMode
  /** Horizontal offset vdoc insets its own content by, in CSS pixels. Omitted if not measured. */
  inset?: number
}

/**
 * The address of one documentation page.
 *
 * Every page has two forms: the file vdoc serves under {@link FRAME_PATH_PREFIX}, which the frame
 * loads, and vdoc's own `/{project}/{version}/{page}`, which its address bar shows. This class is
 * the only place that knows either form. It reads both and writes both, so no caller ever builds or
 * takes apart one of these paths itself.
 *
 * vdoc's frame parameters are dropped on the way in. They are requests to the frame, never part of
 * the page, and a client-side router inside the frame drops them on its next navigation anyway.
 */
export class DocumentationAddress {
  /**
   * @param page The path below the version, without a leading slash. A trailing slash is kept,
   *   because a page published as a directory is served at that address.
   * @param search The query with its leading `?`, or an empty string.
   * @param hash The fragment with its leading `#`, or an empty string. A bare `#` is kept, because a
   *   link to it is a link to the top of the page.
   */
  constructor(
    readonly project: string,
    readonly version: string,
    readonly page: string,
    readonly search: string = '',
    readonly hash: string = ''
  ) {}

  /**
   * The documentation page `href` names, in either form, or `null` if it names none: an address of
   * another origin, or a path too short to name a project and a version.
   *
   * @param href The address to read, absolute or relative to `origin`.
   * @param origin The origin vdoc is served from.
   */
  static parse(href: string, origin: string = window.location.origin): DocumentationAddress | null {
    let url: URL
    try {
      url = new URL(href, origin)
    } catch {
      return null
    }
    if (url.origin !== origin) {
      return null
    }
    // Anchored at the start, so that a page whose own path spells out the prefix keeps it.
    const path = url.pathname.startsWith(FRAME_PATH_PREFIX)
      ? url.pathname.slice(FRAME_PATH_PREFIX.length)
      : url.pathname.slice(1)
    const [project, version, ...pageParts] = path.split('/')
    if (!project || !version) {
      return null
    }
    for (const param of VDOC_FRAME_PARAMS) {
      url.searchParams.delete(param)
    }
    // `URL` reports an empty fragment as no fragment, while the address still ends in `#`.
    const hash = url.hash || (url.href.endsWith('#') ? '#' : '')
    return new DocumentationAddress(project, version, pageParts.join('/'), url.search, hash)
  }

  /**
   * The documentation page `href` names, if it is in the frame form, or `null` otherwise.
   *
   * For the address a frame reports: a frame that ended up anywhere else, for instance on a server
   * that answers unknown paths with vdoc's own application, shows no documentation page.
   */
  static parseFrame(href: string, origin: string = window.location.origin): DocumentationAddress | null {
    return href.startsWith(`${origin}${FRAME_PATH_PREFIX}`) ? DocumentationAddress.parse(href, origin) : null
  }

  private get suffix(): string {
    return `${this.page}${this.search}${this.hash}`
  }

  /** The address that reaches the file, as a path from the origin. */
  get frameHref(): string {
    return `${FRAME_PATH_PREFIX}${this.project}/${this.version}/${this.suffix}`
  }

  /** The address vdoc's own router answers for this page, as a path from the origin. */
  get readableHref(): string {
    return `/${this.project}/${this.version}/${this.suffix}`
  }

  /**
   * The URL to load the frame with: this page, carrying what vdoc tells the frame about itself.
   *
   * The inset is omitted while it is unknown, which the contract allows: a frame without it is
   * misaligned by vdoc's gutter, not broken.
   */
  frameUrl(params: FrameParams, origin: string = window.location.origin): string {
    const url = new URL(this.frameHref, origin)
    url.searchParams.set(VDOC_THEME_PARAM, params.mode)
    if (params.inset != null && params.inset > 0) {
      url.searchParams.set(VDOC_INSET_PARAM, String(Math.round(params.inset)))
    }
    return url.href
  }

  /**
   * Whether `other` is the same document, whatever fragment either points at.
   *
   * Two differences are not differences here:
   *
   * - A trailing slash. A generator that publishes a page as a directory is reached through a
   *   redirect that adds one, while vdoc's router normalizes it away again.
   * - The order of the keys and the encoding of the query. vdoc's router groups the values of a
   *   repeated key and encodes a space as `+`, so the query it hands back can differ from the
   *   frame's in both.
   */
  isSameDocument(other: DocumentationAddress): boolean {
    return this.documentKey === other.documentKey
  }

  /** Whether `other` is the same document at the same fragment. */
  isSamePage(other: DocumentationAddress): boolean {
    return this.isSameDocument(other) && this.hash === other.hash
  }

  private get documentKey(): string {
    const search = new URLSearchParams(this.search)
    search.sort()
    return `${this.project}/${this.version}/${this.page.replace(/\/$/, '')}?${search}`
  }
}

/**
 * The address a link should show for `href`: vdoc's readable address if it names a documentation
 * page, and `href` unchanged otherwise.
 *
 * Applied to every link in a framed page, so that hovering, copying and the browser's own new-tab
 * shortcuts name the page the way vdoc's address bar does.
 */
export function toReadableHref(href: string, origin: string = window.location.origin): string {
  const address = DocumentationAddress.parse(href, origin)
  return address === null ? href : `${origin}${address.readableHref}`
}
