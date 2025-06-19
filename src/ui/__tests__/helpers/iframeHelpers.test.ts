import { describe, test, expect, vi, beforeEach } from 'vitest'
import { toggleDocumentationColorScheme } from '../../helpers/IFrame'

describe('toggleDocumentationColorScheme', () => {
  let mockSetItem: ReturnType<typeof vi.fn>
  let iframeRef: React.RefObject<HTMLIFrameElement>
  let classList: {
    toggle: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    add: ReturnType<typeof vi.fn>
  }
  let documentElement: {
    getAttribute: ReturnType<typeof vi.fn>
    classList: typeof classList
  }

  beforeEach(() => {
    // Reset all mocks
    mockSetItem = vi.fn()
    classList = {
      toggle: vi.fn(),
      remove: vi.fn(),
      add: vi.fn(),
    }
    documentElement = {
      getAttribute: vi.fn(),
      classList,
    }

    const iframe = document.createElement('iframe')

    Object.defineProperty(iframe, 'contentWindow', {
      value: {
        localStorage: {
          setItem: mockSetItem,
        },
      },
      configurable: true,
    })

    iframeRef = {
      current: iframe,
    }

    // Reset contentDocument for each test
    Object.defineProperty(iframe, 'contentDocument', {
      value: {
        documentElement: documentElement as unknown as HTMLElement,
      },
      configurable: true,
    })
  })

  test('does nothing if iframeRef.current is null', () => {
    // WHEN: iframeRef.current is null
    toggleDocumentationColorScheme({ current: null }, 'dark')

    // THEN: No interactions
    expect(mockSetItem).not.toHaveBeenCalled()
    expect(classList.toggle).not.toHaveBeenCalled()
    expect(classList.remove).not.toHaveBeenCalled()
    expect(classList.add).not.toHaveBeenCalled()
  })

  test('handles Doxygen documentation correctly', () => {
    // GIVEN: Doxygen document (xmlns present)
    documentElement.getAttribute.mockReturnValue('http://www.w3.org/1999/xhtml')

    toggleDocumentationColorScheme(iframeRef, 'dark')

    // THEN: Applies Doxygen logic and no sphinx class changes
    expect(mockSetItem).toHaveBeenCalledWith('darkMode', 'dark')
    expect(documentElement.getAttribute).toHaveBeenCalledWith('xmlns')
    expect(classList.remove).toHaveBeenCalledWith('light-mode', 'dark-mode')
    expect(classList.add).toHaveBeenCalledWith('dark-mode')

    expect(classList.toggle).not.toHaveBeenCalled()
  })

  test('handles Sphinx documentation correctly', () => {
    // GIVEN: Sphinx document (xmlns not present)
    documentElement.getAttribute.mockReturnValue(null)

    toggleDocumentationColorScheme(iframeRef, 'light')

    // THEN: Applies Sphinx logic and no Doxygen class changes
    expect(mockSetItem).toHaveBeenCalledWith('darkMode', 'light')
    expect(documentElement.getAttribute).toHaveBeenCalledWith('xmlns')
    expect(classList.toggle).toHaveBeenCalledWith('dark', false)

    expect(classList.remove).not.toHaveBeenCalled()
    expect(classList.add).not.toHaveBeenCalled()
  })
})
