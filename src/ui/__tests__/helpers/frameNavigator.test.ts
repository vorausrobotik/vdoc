import { describe, expect, test, vi } from 'vitest'
import { DocumentationAddress } from '@/helpers/DocumentationAddress'
import { FrameNavigator } from '@/helpers/FrameNavigator'

const origin = window.location.origin
const params = { mode: 'dark' as const, inset: 24 }

const address = (href: string): DocumentationAddress => {
  const parsed = DocumentationAddress.parse(href)
  if (parsed === null) {
    throw new Error(`'${href}' names no documentation page`)
  }
  return parsed
}

/** A framed window that sits at `href` and records where it is sent. */
const frameAt = (href: string) => {
  const replace = vi.fn()
  const frameWindow = { location: { href: `${origin}${href}`, replace } } as unknown as Window
  return { navigator: new FrameNavigator(() => frameWindow), replace }
}

describe('FrameNavigator.navigate', () => {
  test('changes only the fragment of a document a client-side router left without parameters', () => {
    // GIVEN: A frame a client-side router moved to the guide, without vdoc's parameters
    const { navigator, replace } = frameAt('/static/projects/proj/1.0.0/guide')

    // WHEN: vdoc moves it to a chapter of that guide
    const move = navigator.navigate(address('/proj/1.0.0/guide#chapter2'), params)

    // THEN: The frame keeps its own address and changes the fragment, so no document is loaded
    expect(move).toBe('fragment')
    expect(replace).toHaveBeenCalledWith(`${origin}/static/projects/proj/1.0.0/guide#chapter2`)
  })

  test('keeps the parameters of a document vdoc loaded itself', () => {
    const { navigator, replace } = frameAt('/static/projects/proj/1.0.0/guide/?vdoc-theme=dark#one')

    expect(navigator.navigate(address('/proj/1.0.0/guide#two'), params)).toBe('fragment')
    expect(replace).toHaveBeenCalledWith(`${origin}/static/projects/proj/1.0.0/guide/?vdoc-theme=dark#two`)
  })

  test('loads another document with the parameters of vdoc', () => {
    const { navigator, replace } = frameAt('/static/projects/proj/1.0.0/guide')

    expect(navigator.navigate(address('/proj/1.0.0/api#section'), params)).toBe('load')
    expect(replace).toHaveBeenCalledWith(
      `${origin}/static/projects/proj/1.0.0/api?vdoc-theme=dark&vdoc-inset=24#section`
    )
  })

  test('loads the document again for a target without a fragment', () => {
    // GIVEN: A frame on a chapter of the guide
    const { navigator, replace } = frameAt('/static/projects/proj/1.0.0/guide#chapter2')

    // WHEN/THEN: Only an address with a fragment can be reached without a load, so the guide loads
    expect(navigator.navigate(address('/proj/1.0.0/guide'), params)).toBe('load')
    expect(replace).toHaveBeenCalledWith(`${origin}/static/projects/proj/1.0.0/guide?vdoc-theme=dark&vdoc-inset=24`)
  })

  test('expects the frame where it sent it, before it arrives', () => {
    const { navigator } = frameAt('/static/projects/proj/1.0.0/guide')

    navigator.navigate(address('/proj/1.0.0/api'), params)

    expect(navigator.expects(address('/static/projects/proj/1.0.0/api?vdoc-theme=dark'))).toBe(true)
    expect(navigator.expects(address('/proj/1.0.0/guide'))).toBe(false)
  })
})

describe('FrameNavigator.expects', () => {
  test('follows where the frame reported to be', () => {
    const { navigator } = frameAt('/static/projects/proj/1.0.0/guide')

    navigator.arrived(address('/static/projects/proj/1.0.0/guide/'))

    expect(navigator.expects(address('/proj/1.0.0/guide'))).toBe(true)
  })

  test('expects nothing before anything happened', () => {
    const { navigator } = frameAt('/static/projects/proj/1.0.0/guide')

    expect(navigator.expects(address('/proj/1.0.0/guide'))).toBe(false)
    expect(navigator.expects(null)).toBe(false)
  })
})

describe('FrameNavigator.reload', () => {
  test('loads the page the frame shows with new parameters, and expects it there', () => {
    const { navigator, replace } = frameAt('/static/projects/proj/1.0.0/guide?vdoc-theme=dark#chapter2')

    expect(navigator.reload({ mode: 'light' })).toBe(true)
    expect(replace).toHaveBeenCalledWith(`${origin}/static/projects/proj/1.0.0/guide?vdoc-theme=light#chapter2`)
    expect(navigator.expects(address('/proj/1.0.0/guide#chapter2'))).toBe(true)
  })

  test('does nothing for a frame that shows no documentation page', () => {
    const replace = vi.fn()
    const frameWindow = { location: { href: 'about:blank', replace } } as unknown as Window

    expect(new FrameNavigator(() => frameWindow).reload(params)).toBe(false)
    expect(replace).not.toHaveBeenCalled()
  })
})
