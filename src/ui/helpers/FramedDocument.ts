import type { IFrameHistoryMode } from './IFrame'

/**
 * Marker set on a framed window once it is hooked. `load` can fire more than once for the same
 * document; hooking it twice would stack a second `history.pushState` wrapper, report every
 * navigation N times and handle every click twice.
 */
type HookedWindow = Window & typeof globalThis & { __vdocFrameHooked?: boolean }

/**
 * What vdoc wants to know about a framed document, and what it wants done with the links in it.
 *
 * Everything here is a decision only vdoc can make: which project a link belongs to, where vdoc's
 * own interface should send the reader, what its address bar should say. The mechanics of noticing
 * any of it belong to {@link hookFramedDocument}.
 */
export interface FramedDocumentHandlers {
  /** The frame navigated itself, without discarding the document. */
  onNavigated: (historyMode: IFrameHistoryMode) => void
  /** The framed document changed its title, which a client-side router does after navigating. */
  onTitleChanged: (title: string) => void
  /**
   * Whether `href` is where vdoc already believes the frame is. Only vdoc knows when two addresses
   * are the same page, so it answers rather than being asked for a string.
   */
  isAlreadyRecorded: (href: string) => boolean
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
 * Subscribe to a framed document, so that vdoc learns where it goes, stays in charge of the links
 * that lead out of it, and the links show the address vdoc's own interface answers for.
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

  // Single page documentation swaps pages in place with history.pushState. No document is
  // discarded, so no `load` fires, and neither method emits an event of its own - wrapping them is
  // the only way to learn about those navigations.
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = frameWindow.history[method].bind(frameWindow.history)
    frameWindow.history[method] = (...args: Parameters<History['pushState']>) => {
      original(...args)
      // The frame has already written its own history entry (or deliberately replaced it), so vdoc
      // must only correct that entry's address instead of adding a second one.
      handlers.onNavigated('replace')
    }
  }

  frameWindow.addEventListener('popstate', () => {
    // popstate also fires for the fragment navigations vdoc performs itself, and when a top-level
    // traversal restores a frame position vdoc already recorded. Only a move the frame made on its
    // own is news here - reporting the others would overwrite the address vdoc is in the middle of
    // navigating to.
    if (handlers.isAlreadyRecorded(frameWindow.location.href)) {
      return
    }
    handlers.onNavigated('replace')
  })

  // A client-side router sets the title after the navigation, so the title read while handling the
  // navigation itself is still the previous page's. Watch the head for the one that arrives late.
  new hookedWindow.MutationObserver(() => handlers.onTitleChanged(frameWindow.document.title)).observe(
    frameWindow.document.head,
    { childList: true, subtree: true, characterData: true }
  )

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
