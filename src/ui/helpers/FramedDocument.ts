/**
 * Marker set on a framed window once it is hooked. `load` can fire more than once for the same
 * document; hooking it twice would install a second set of listeners and handle every click
 * twice, the second time on a frame that is already navigating away.
 */
type HookedWindow = Window & typeof globalThis & { __vdocFrameHooked?: boolean }

/**
 * What vdoc wants done with the links in a framed document.
 *
 * Everything here is a decision only vdoc can make: which project a link belongs to, where vdoc's
 * own interface should send the reader, which address it wants a link to show. The mechanics of
 * noticing a click and of reaching the anchors belong to {@link hookFramedDocument}.
 */
export interface FramedDocumentHandlers {
  /** The address a link should carry for hovering, copying and the browser's new-tab shortcuts. */
  displayHref: (href: string) => string
  /** Whether a link leads somewhere that must not take over the frame. */
  leadsOutOfTheFrame: (href: string) => boolean
  /** Follow a link the framed document did not handle itself, inside the frame. */
  followInTheFrame: (href: string) => void
  /** Follow a link that must not take over the frame. */
  followOutsideTheFrame: (href: string) => void
}

/** The anchor a click landed on, if any. */
function clickedAnchor(event: Event): HTMLAnchorElement | null {
  // The event target belongs to the framed realm, so `instanceof` is not usable here.
  const target = event.target as Element | null
  return typeof target?.closest === 'function' ? target.closest('a') : null
}

/** Whether the browser's own new-tab and download shortcuts should be left to do their work. */
function isPlainLeftClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/**
 * Whether a link must keep the address that reaches the file behind the frame.
 *
 * The browser fetches a download's href itself, and vdoc's readable address answers with vdoc's
 * application rather than with the file.
 */
function isDownload(anchor: HTMLAnchorElement): boolean {
  return anchor.hasAttribute('download')
}

/**
 * Subscribe to a framed document, so that vdoc stays in charge of the links that lead out of it
 * and the links show the address vdoc's own interface answers for.
 *
 * Called once per framed document; further calls for the same document do nothing.
 *
 * @param frameWindow The framed window, which is same-origin with vdoc.
 * @param handlers The decisions vdoc makes about that document.
 */
export function hookFramedDocument(frameWindow: Window, handlers: FramedDocumentHandlers): void {
  const hookedWindow = frameWindow as HookedWindow
  if (hookedWindow.__vdocFrameHooked) {
    return
  }
  hookedWindow.__vdocFrameHooked = true

  // Show the readable address rather than the one that reaches the file, so that hovering, the
  // status bar, copying a link and the browser's own new-tab shortcuts all name the page the way
  // vdoc's address bar does. Only the display is changed: every navigation resolves the address
  // back, so a link whose href a framework restores still leads to the same place.
  frameWindow.document.querySelectorAll('a').forEach((anchor: HTMLAnchorElement) => {
    // Ignore empty links, they may be handled with js internally.
    if (anchor.href.trim() === '' || isDownload(anchor)) {
      return
    }
    anchor.href = handlers.displayHref(anchor.href)
  })

  /**
   * Take links that lead out of the frame during the capture phase, before a client-side router
   * inside it gets the chance to route another project or origin into it. Delegated rather than
   * applied per anchor, so that links rendered after the document loaded are covered too.
   */
  frameWindow.document.addEventListener(
    'click',
    (event: Event) => {
      const mouseEvent = event as MouseEvent
      // A modified click is the reader asking the browser for a new tab or a saved file, and the
      // addresses the anchors carry are the ones vdoc wants opened - so let the browser do it.
      if (!isPlainLeftClick(mouseEvent)) {
        return
      }
      const anchor = clickedAnchor(event)
      if (anchor === null || anchor.href.trim() === '' || isDownload(anchor)) {
        return
      }
      if (anchor.target !== '_blank' && !handlers.leadsOutOfTheFrame(anchor.href)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      handlers.followOutsideTheFrame(anchor.href)
    },
    true
  )

  /**
   * Navigate the frame for the links nothing inside it handled. A client-side router calls
   * `preventDefault()` for the links it routes itself; those are left alone, which is what gives
   * single page documentation its client-side navigation.
   */
  frameWindow.document.addEventListener('click', (event: Event) => {
    const mouseEvent = event as MouseEvent
    if (mouseEvent.defaultPrevented || !isPlainLeftClick(mouseEvent)) {
      return
    }
    const anchor = clickedAnchor(event)
    // Ignore empty links, they may be handled with js internally.
    if (anchor === null || anchor.href.trim() === '') {
      return
    }
    // Let the browser handle downloads and anything aimed at another browsing context.
    if (isDownload(anchor) || (anchor.target !== '' && anchor.target !== '_self')) {
      return
    }
    event.preventDefault()
    handlers.followInTheFrame(anchor.href)
  })
}
