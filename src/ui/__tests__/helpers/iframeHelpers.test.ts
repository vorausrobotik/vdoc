import { describe, test, expect, vi, beforeEach } from 'vitest'
import { toggleDocumentationColorScheme, parseIFrameHref } from '../../helpers/IFrame'

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

describe('parseIFrameHref', () => {
  let iframeRef: React.RefObject<HTMLIFrameElement>
  const stripPrefix = '/static/projects/'

  beforeEach(() => {
    const iframe = document.createElement('iframe')
    iframeRef = { current: iframe }
  })

  test.each([
    {
      description: 'returns null when iframeRef.current is null',
      setup: () => {
        iframeRef = { current: null }
      },
    },
    {
      description: 'returns null when contentDocument.location.href is null',
      setup: () => {
        Object.defineProperty(iframeRef.current, 'contentDocument', {
          value: {
            location: { href: null },
            title: 'Test Title',
          },
          configurable: true,
        })
      },
    },
    {
      description: 'returns null when URL does not contain stripPrefix',
      setup: () => {
        const href = 'http://localhost:3000/other/path/example/1.0.0/page.html'
        Object.defineProperty(iframeRef.current, 'contentDocument', {
          value: {
            location: { href },
            title: 'Page',
          },
          configurable: true,
        })
      },
    },
  ])('$description', ({ setup }) => {
    // GIVEN: Specific error condition
    setup()

    // WHEN: Parsing the URL
    const result = parseIFrameHref(iframeRef, stripPrefix)

    // THEN: Returns null
    expect(result).toBeNull()
  })

  test.each([
    {
      description: 'parses URL with page only (no hash)',
      href: 'http://localhost:3000/static/projects/example-project/1.0.0/index.html',
      title: 'Index Page',
      expected: {
        name: 'example-project',
        version: '1.0.0',
        page: 'index.html',
        hash: '',
        title: 'Index Page',
      },
    },
    {
      description: 'parses URL with page and hash',
      href: 'http://localhost:3000/static/projects/example-project/1.0.0/docs.html#section',
      title: 'Documentation',
      expected: {
        name: 'example-project',
        version: '1.0.0',
        page: 'docs.html',
        hash: 'section',
        title: 'Documentation',
      },
    },
    {
      description: 'parses URL with nested path',
      href: 'http://localhost:3000/static/projects/example-project/2.0.0/api/modules/core.html',
      title: 'Core Module',
      expected: {
        name: 'example-project',
        version: '2.0.0',
        page: 'api/modules/core.html',
        hash: '',
        title: 'Core Module',
      },
    },
    {
      description: 'parses URL with nested path and hash',
      href: 'http://localhost:3000/static/projects/project/1.0.0/api/classes/MyClass.html#method',
      title: 'MyClass',
      expected: {
        name: 'project',
        version: '1.0.0',
        page: 'api/classes/MyClass.html',
        hash: 'method',
        title: 'MyClass',
      },
    },
    {
      description: 'handles empty title gracefully',
      href: 'http://localhost:3000/static/projects/example/1.0.0/page.html',
      title: undefined,
      expected: {
        name: 'example',
        version: '1.0.0',
        page: 'page.html',
        hash: '',
        title: '',
      },
    },
    {
      description: 'handles URL with just project root',
      href: 'http://localhost:3000/static/projects/example/1.0.0/',
      title: 'Project Root',
      expected: {
        name: 'example',
        version: '1.0.0',
        page: '',
        hash: '',
        title: 'Project Root',
      },
    },
    {
      description: 'handles hash with special characters',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html#section-1.2.3',
      title: 'Page',
      expected: {
        name: 'proj',
        version: '1.0.0',
        page: 'page.html',
        hash: 'section-1.2.3',
        title: 'Page',
      },
    },
  ])('$description', ({ href, title, expected }) => {
    // GIVEN: URL with specific structure
    Object.defineProperty(iframeRef.current, 'contentDocument', {
      value: {
        location: { href },
        title,
      },
      configurable: true,
    })

    // WHEN: Parsing the URL
    const result = parseIFrameHref(iframeRef, stripPrefix)

    // THEN: Returns expected result
    expect(result).toEqual(expected)
  })
})
