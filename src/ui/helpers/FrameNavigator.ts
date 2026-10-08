import { DocumentationAddress, type FrameParams } from './DocumentationAddress'

/** How the frame got to where {@link FrameNavigator.navigate} sent it. */
export type FrameMove = 'fragment' | 'load'

/**
 * The one owner of every navigation vdoc performs in the frame, and of where vdoc expects the frame
 * to be.
 *
 * vdoc and the frame both move the frame, and each reports its moves to the other. The expected
 * address is what tells the two apart: a move that arrives where vdoc expected it is vdoc's own and
 * must not be reported back as news. Every navigation goes through here, so that no path can move
 * the frame without recording where it is going.
 *
 * Every move uses `location.replace`, so that the frame adds no session history entry. vdoc's own
 * router adds one for the same navigation, and two would make the back button need two clicks.
 */
export class FrameNavigator {
  private expected: DocumentationAddress | null = null

  /** @param frameWindow The framed window, looked up on every move because the frame may not exist yet. */
  constructor(private readonly frameWindow: () => Window | null | undefined) {}

  /** Whether the frame is at, or on its way to, `address`. */
  expects(address: DocumentationAddress | null): boolean {
    return address !== null && this.expected !== null && address.isSamePage(this.expected)
  }

  /** The frame reported that it is at `address`, whoever moved it there. */
  arrived(address: DocumentationAddress): void {
    this.expected = address
  }

  /**
   * Move the frame to `target`.
   *
   * A target in the document the frame already shows is reached by changing the fragment alone,
   * which loads nothing and keeps the reader's place in a single page application. Only a URL with a
   * fragment can be reached that way, so a target without one loads its document.
   *
   * @returns `fragment` when no document was loaded. No `load` event reports such a move, so the
   *   caller has to.
   */
  navigate(target: DocumentationAddress, params: FrameParams): FrameMove {
    this.expected = target
    const frameWindow = this.frameWindow()
    if (frameWindow == null) {
      return 'load'
    }
    if (target.hash !== '' && DocumentationAddress.parseFrame(frameWindow.location.href)?.isSameDocument(target)) {
      // The frame's own address rather than the target's: a client-side router may have dropped
      // vdoc's parameters or written the path in another form, and any difference beyond the
      // fragment turns the move into a document load.
      const url = new URL(frameWindow.location.href)
      url.hash = target.hash
      frameWindow.location.replace(url.href)
      return 'fragment'
    }
    frameWindow.location.replace(target.frameUrl(params))
    return 'load'
  }

  /**
   * Load the page the frame shows once more, with `params`.
   *
   * @returns whether a reload was started.
   */
  reload(params: FrameParams): boolean {
    const frameWindow = this.frameWindow()
    const current = frameWindow == null ? null : DocumentationAddress.parseFrame(frameWindow.location.href)
    if (frameWindow == null || current === null) {
      return false
    }
    this.expected = current
    frameWindow.location.replace(current.frameUrl(params))
    return true
  }
}
