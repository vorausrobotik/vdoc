import { describe, expect, test } from 'vitest'
import {
  normalizeIFrameSrc,
  sanitizeDocuUri,
  stripFramePrefix,
  toFrameHref,
  toReadableHref,
} from '../../helpers/RouteHelpers'

describe('sanitizeDocuUri', () => {
  test('sanitizes valid uris as expected', () => {
    const basePath = 'http://localhost:8080'
    const testData = [
      {
        input: {
          href: `${basePath}/project-one/6.0/index.html#`,
        },
        // Empty hash must be removed
        expected: {
          projectName: 'project-one',
          version: '6.0',
          _splat: 'index.html',
          href: `${basePath}/project-one/6.0/index.html`,
        },
      },
      {
        input: {
          href: `project-one/6.0/index.html#id`,
        },
        expected: {
          projectName: 'project-one',
          version: '6.0',
          _splat: 'index.html#id',
          href: 'project-one/6.0/index.html#id',
        },
      },
      {
        // No reminder (index.html or whatever) must work
        input: {
          href: `${basePath}/meta-project/1.3.0/#id?test=foo`,
        },
        expected: {
          projectName: 'meta-project',
          version: '1.3.0',
          _splat: '#id?test=foo',
          href: `${basePath}/meta-project/1.3.0/#id?test=foo`,
        },
      },
      {
        input: {
          href: `${basePath}/meta-project/1.3.0/index.html#id?foo=bar&bar=foo`,
        },
        // Hash and search must work
        expected: {
          projectName: 'meta-project',
          version: '1.3.0',
          _splat: 'index.html#id?foo=bar&bar=foo',
          href: `${basePath}/meta-project/1.3.0/index.html#id?foo=bar&bar=foo`,
        },
      },
      {
        // Override name and version must work
        input: {
          href: `${basePath}/project-one/1.0.0/examples.html#examples`,
          overrideVersion: 'latest',
          overrideName: 'example',
        },
        expected: {
          projectName: 'example',
          version: 'latest',
          _splat: 'examples.html#examples',
          href: `${basePath}/example/latest/examples.html#examples`,
        },
      },
      {
        input: {
          href: `${basePath}/static/projects/project-one/latest/examples.html#examples`,
        },
        expected: {
          projectName: 'project-one',
          version: 'latest',
          _splat: 'examples.html#examples',
          href: `${basePath}/project-one/latest/examples.html#examples`,
        },
      },
    ]
    testData.forEach(({ input, expected }) => {
      expect(sanitizeDocuUri(input.href, input.overrideName, input.overrideVersion)).toStrictEqual(expected)
    })
  })
  test('sanitizing invalid or external uris must throw errors', () => {
    const testData = ['https://google.com', 'http://localhost:9000']
    testData.forEach((href) => {
      expect(() => sanitizeDocuUri(href)).toThrowError(`Unable to match URI '${href}'`)
    })
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

describe('stripFramePrefix', () => {
  test.each([
    {
      description: 'removes the prefix a documentation file is served under',
      pathname: '/static/projects/proj/1.0.0/page.html',
      expected: '/proj/1.0.0/page.html',
    },
    {
      description: 'leaves a path that does not carry it alone',
      pathname: '/proj/1.0.0/page.html',
      expected: '/proj/1.0.0/page.html',
    },
    {
      description: 'is anchored at the start, so a page whose own path spells out the prefix keeps it',
      pathname: '/static/projects/proj/1.0.0/static/projects/deep.html',
      expected: '/proj/1.0.0/static/projects/deep.html',
    },
    {
      description: 'does not touch a prefix that only appears further along the path',
      pathname: '/proj/1.0.0/static/projects/deep.html',
      expected: '/proj/1.0.0/static/projects/deep.html',
    },
    {
      description: 'keeps a trailing slash, which is part of the path',
      pathname: '/static/projects/proj/1.0.0/guide/',
      expected: '/proj/1.0.0/guide/',
    },
    {
      description: 'reduces the bare prefix to the root',
      pathname: '/static/projects/',
      expected: '/',
    },
  ])('$description', ({ pathname, expected }) => {
    expect(stripFramePrefix(pathname)).toBe(expected)
  })

  test('is idempotent', () => {
    // GIVEN: A path that has already had the prefix removed
    const stripped = stripFramePrefix('/static/projects/proj/1.0.0/page.html')

    // WHEN/THEN: Removing it again changes nothing
    expect(stripFramePrefix(stripped)).toBe(stripped)
  })
})

describe('sanitizeDocuUri and toReadableHref agree where they must', () => {
  test.each([
    '/static/projects/proj/1.0.0/page.html',
    '/static/projects/proj/1.0.0/api/classes/My.html',
    '/static/projects/proj/1.0.0/page.html?q=search',
  ])('both name the same page for %s', (path) => {
    // GIVEN: An ordinary documentation page address
    const origin = 'http://localhost:3000'

    // WHEN/THEN: The router parameters and the address a link should show describe one page, so a
    // reader who copies a link and a reader who reads vdoc's address bar see the same thing
    expect(sanitizeDocuUri(`${origin}${path}`).href).toBe(toReadableHref(path, origin))
  })

  test('a page whose own path spells out the frame prefix keeps it in both', () => {
    // GIVEN: A documentation page that itself lives under a path named like the frame prefix.
    // Before `stripFramePrefix` was the single rule, `sanitizeDocuUri` swallowed that segment
    // because it replaced the prefix wherever it appeared rather than at the start of the path.
    const origin = 'http://localhost:3000'
    const path = '/static/projects/proj/1.0.0/static/projects/deep.html'

    // WHEN/THEN: Both keep the page where it is
    expect(sanitizeDocuUri(`${origin}${path}`)._splat).toBe('static/projects/deep.html')
    expect(toReadableHref(path, origin)).toBe(`${origin}/proj/1.0.0/static/projects/deep.html`)
  })
})

describe('normalizeIFrameSrc', () => {
  const origin = 'http://localhost:3000'

  test.each([
    {
      description: 'makes a relative source absolute',
      src: '/static/projects/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
    },
    {
      description: 'leaves an absolute source alone',
      src: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
    },
    {
      description: 'preserves an existing query and hash',
      src: '/static/projects/proj/1.0.0/page.html?q=search#section',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search#section',
    },
    {
      description: 'removes a trailing slash, so a page published as a directory has one identity',
      src: '/static/projects/proj/1.0.0/guide/',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/guide',
    },
    {
      description: 'removes a trailing slash while keeping the query and the hash',
      src: '/static/projects/proj/1.0.0/guide/?q=search#section',
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/guide?q=search#section',
    },
    {
      description: 'keeps the root slash, which is the whole path',
      src: '/',
      expected: 'http://localhost:3000/',
    },
  ])('$description', ({ src, expected }) => {
    expect(normalizeIFrameSrc(src, origin)).toBe(expected)
  })

  test('a page reached through a redirect that adds a trailing slash keeps its identity', () => {
    // GIVEN: The address vdoc asked for, and the one the frame ended up on after the normalization
    // a generator that publishes pages as directories performs
    const requested = '/static/projects/proj/1.0.0/guide'
    const reached = 'http://localhost:3000/static/projects/proj/1.0.0/guide/'

    // WHEN/THEN: They are the same page, so the frame is not force-loaded back and forth forever
    expect(normalizeIFrameSrc(reached, origin)).toBe(normalizeIFrameSrc(requested, origin))
  })

  test('two different pages keep two identities', () => {
    // GIVEN: Two pages that differ in more than a trailing slash
    // WHEN/THEN: They stay distinguishable, or the frame would never be loaded for the second one
    expect(normalizeIFrameSrc('/static/projects/proj/1.0.0/guide', origin)).not.toBe(
      normalizeIFrameSrc('/static/projects/proj/1.0.0/api', origin)
    )
  })
})
