import { beforeEach, describe, expect, test, vi } from 'vitest'
import { parseIFrameHref, toFrameHref, toggleDocumentationColorScheme, toReadableHref } from '../../helpers/IFrame'

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
  let iframeRef: React.RefObject<HTMLIFrameElement | null>

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
      description: 'returns null when URL does not contain the frame path prefix',
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
    const result = parseIFrameHref(iframeRef)

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
        search: new URLSearchParams(''),
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
        search: new URLSearchParams(''),
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
        search: new URLSearchParams(''),
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
        search: new URLSearchParams(''),
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
        search: new URLSearchParams(''),
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
        search: new URLSearchParams(''),
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
        search: new URLSearchParams(''),
        hash: 'section-1.2.3',
        title: 'Page',
      },
    },
    {
      description: 'parses URL with search parameters only',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?highlight=term',
      title: 'Page',
      expected: {
        name: 'proj',
        version: '1.0.0',
        page: 'page.html',
        search: new URLSearchParams('highlight=term'),
        hash: '',
        title: 'Page',
      },
    },
    {
      description: 'parses URL with multiple search parameters and hash',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search&filter=all#foo',
      title: 'Page',
      expected: {
        name: 'proj',
        version: '1.0.0',
        page: 'page.html',
        search: new URLSearchParams('q=search&filter=all'),
        hash: 'foo',
        title: 'Page',
      },
    },
    {
      description: 'parses URL with search and hash',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=test#section',
      title: 'Page',
      expected: {
        name: 'proj',
        version: '1.0.0',
        page: 'page.html',
        search: new URLSearchParams('q=test'),
        hash: 'section',
        title: 'Page',
      },
    },
    {
      description: 'parses URL with nested path, search and hash',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/api/docs.html?tab=examples#code',
      title: 'API Docs',
      expected: {
        name: 'proj',
        version: '1.0.0',
        page: 'api/docs.html',
        search: new URLSearchParams('tab=examples'),
        hash: 'code',
        title: 'API Docs',
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
    const result = parseIFrameHref(iframeRef)

    // THEN: Returns expected result
    expect(result).toEqual(expected)
  })
})

describe('toReadableHref', () => {
  const origin = 'http://localhost:3000'

  test.each([
    {
      description: 'strips the frame prefix, so the address names the page rather than the file',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/proj/1.0.0/page.html',
    },
    {
      description: 'keeps the query and the hash',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search#section',
      expected: 'http://localhost:3000/proj/1.0.0/page.html?q=search#section',
    },
    {
      description: 'keeps a fragment-only address on its page',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html#',
      expected: 'http://localhost:3000/proj/1.0.0/page.html#',
    },
    {
      description: 'keeps a nested path',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/api/classes/MyClass.html',
      expected: 'http://localhost:3000/proj/1.0.0/api/classes/MyClass.html',
    },
    {
      description: 'keeps a trailing slash, which is the address a directory page is served at',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/guide/',
      expected: 'http://localhost:3000/proj/1.0.0/guide/',
    },
    {
      description: 'resolves a relative address against the origin',
      href: '/static/projects/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/proj/1.0.0/page.html',
    },
    {
      description: 'leaves an external address verbatim',
      href: 'https://www.sphinx-doc.org/',
      expected: 'https://www.sphinx-doc.org/',
    },
    {
      description: 'leaves an external address without a trailing slash verbatim',
      href: 'https://example.com',
      expected: 'https://example.com',
    },
    {
      description: 'leaves a mail address verbatim',
      href: 'mailto:someone@example.com',
      expected: 'mailto:someone@example.com',
    },
    {
      description: 'leaves an address of vdocs own origin that is not a framed file alone',
      href: 'http://localhost:3000/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/proj/1.0.0/page.html',
    },
  ])('$description', ({ href, expected }) => {
    expect(toReadableHref(href, origin)).toBe(expected)
  })

  test('is idempotent', () => {
    // GIVEN: An address that has already been converted once
    const readable = toReadableHref('http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search', origin)

    // WHEN/THEN: Converting again changes nothing, so a second pass over the same anchors is safe
    expect(toReadableHref(readable, origin)).toBe(readable)
  })
})

describe('toFrameHref', () => {
  const origin = 'http://localhost:3000'

  test.each([
    {
      description: 'restores the frame prefix, so the address reaches the documentation file',
      href: 'http://localhost:3000/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
    },
    {
      description: 'keeps the query and the hash',
      href: 'http://localhost:3000/proj/1.0.0/page.html?q=search#section',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search#section',
    },
    {
      description: 'keeps a fragment-only address on its page',
      href: 'http://localhost:3000/proj/1.0.0/page.html#',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html#',
    },
    {
      description: 'keeps a nested path',
      href: 'http://localhost:3000/proj/1.0.0/api/classes/MyClass.html',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/api/classes/MyClass.html',
    },
    {
      description: 'keeps a trailing slash, which is the address a directory page is served at',
      href: 'http://localhost:3000/proj/1.0.0/guide/',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/guide/',
    },
    {
      description: 'resolves a relative address against the origin',
      href: '/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
    },
    {
      description: 'leaves an external address verbatim',
      href: 'https://www.sphinx-doc.org/',
      expected: 'https://www.sphinx-doc.org/',
    },
    {
      description: 'leaves a mail address verbatim',
      href: 'mailto:someone@example.com',
      expected: 'mailto:someone@example.com',
    },
  ])('$description', ({ href, expected }) => {
    expect(toFrameHref(href, origin)).toBe(expected)
  })

  test('is idempotent, so an address a framework restored is not prefixed twice', () => {
    // GIVEN: The address the documentation authored, which a re-render puts back on the anchor
    const authored = 'http://localhost:3000/static/projects/proj/1.0.0/page.html'

    // WHEN/THEN: Resolving it is a no-op rather than a second prefix
    expect(toFrameHref(authored, origin)).toBe(authored)
  })

  test('inverts toReadableHref', () => {
    // GIVEN: The address of a documentation file, with a query and a hash
    const frameHref = 'http://localhost:3000/static/projects/proj/1.0.0/api/docs.html?tab=examples#code'

    // WHEN/THEN: Going to the readable form and back arrives at exactly the same address, which is
    // what lets a rewritten anchor be navigated without remembering anything about it
    expect(toFrameHref(toReadableHref(frameHref, origin), origin)).toBe(frameHref)
  })
})
