import { describe, expect, test } from 'vitest'
import { DocumentationAddress, toReadableHref } from '@/helpers/DocumentationAddress'
import { parseSearch, stringifySearch } from '@/helpers/RouteHelpers'

const origin = 'http://localhost:3000'

const parse = (href: string): DocumentationAddress => {
  const address = DocumentationAddress.parse(href, origin)
  if (address === null) {
    throw new Error(`'${href}' names no documentation page`)
  }
  return address
}

describe('DocumentationAddress.parse', () => {
  test.each([
    {
      description: 'reads the frame form',
      href: '/static/projects/proj/1.0.0/page.html',
      expected: { project: 'proj', version: '1.0.0', page: 'page.html', search: '', hash: '' },
    },
    {
      description: 'reads the readable form',
      href: '/proj/1.0.0/page.html',
      expected: { project: 'proj', version: '1.0.0', page: 'page.html', search: '', hash: '' },
    },
    {
      description: 'reads an absolute address of its own origin',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
      expected: { project: 'proj', version: '1.0.0', page: 'page.html', search: '', hash: '' },
    },
    {
      description: 'keeps a nested path',
      href: '/static/projects/proj/1.0.0/api/classes/MyClass.html',
      expected: { project: 'proj', version: '1.0.0', page: 'api/classes/MyClass.html', search: '', hash: '' },
    },
    {
      description: 'keeps a trailing slash, which is the address a directory page is served at',
      href: '/static/projects/proj/1.0.0/guide/',
      expected: { project: 'proj', version: '1.0.0', page: 'guide/', search: '', hash: '' },
    },
    {
      description: 'reads the root page of a version',
      href: '/static/projects/proj/1.0.0/',
      expected: { project: 'proj', version: '1.0.0', page: '', search: '', hash: '' },
    },
    {
      description: 'keeps the query and the hash',
      href: '/static/projects/proj/1.0.0/page.html?q=search#section',
      expected: { project: 'proj', version: '1.0.0', page: 'page.html', search: '?q=search', hash: '#section' },
    },
    {
      description: 'keeps a bare fragment, which links to the top of the page',
      href: '/static/projects/proj/1.0.0/page.html#',
      expected: { project: 'proj', version: '1.0.0', page: 'page.html', search: '', hash: '#' },
    },
    {
      description: 'keeps a fragment that contains a question mark',
      href: '/meta-project/1.3.0/#id?test=foo',
      expected: { project: 'meta-project', version: '1.3.0', page: '', search: '', hash: '#id?test=foo' },
    },
    {
      description: 'drops the parameters of vdoc, and only those',
      href: '/static/projects/proj/1.0.0/page?_highlight=beta&vdoc-theme=dark&vdoc-inset=24#section',
      expected: { project: 'proj', version: '1.0.0', page: 'page', search: '?_highlight=beta', hash: '#section' },
    },
    {
      description: 'keeps a repeated key, in order',
      href: '/static/projects/proj/1.0.0/page?_highlight=alpha&_highlight=beta',
      expected: {
        project: 'proj',
        version: '1.0.0',
        page: 'page',
        search: '?_highlight=alpha&_highlight=beta',
        hash: '',
      },
    },
    {
      description: 'is anchored at the start, so a page whose own path spells out the prefix keeps it',
      href: '/static/projects/proj/1.0.0/static/projects/deep.html',
      expected: { project: 'proj', version: '1.0.0', page: 'static/projects/deep.html', search: '', hash: '' },
    },
  ])('$description', ({ href, expected }) => {
    expect({ ...parse(href) }).toStrictEqual(expected)
  })

  test.each([
    { description: 'an address of another origin', href: 'https://www.sphinx-doc.org/' },
    { description: 'a mail address', href: 'mailto:someone@example.com' },
    { description: 'the bare frame prefix', href: '/static/projects/' },
    { description: 'a path without a version', href: '/static/projects/proj/' },
    { description: 'the root of the origin', href: 'http://localhost:9000' },
  ])('names no page for $description', ({ href }) => {
    expect(DocumentationAddress.parse(href, origin)).toBeNull()
  })
})

describe('DocumentationAddress.parseFrame', () => {
  test('reads an address in the frame form', () => {
    expect(DocumentationAddress.parseFrame('http://localhost:3000/static/projects/proj/1.0.0/p.html', origin)).toEqual(
      parse('/proj/1.0.0/p.html')
    )
  })

  test.each([
    { description: 'the readable form', href: 'http://localhost:3000/proj/1.0.0/p.html' },
    { description: 'an empty frame', href: 'about:blank' },
    { description: 'another origin', href: 'https://example.com/static/projects/proj/1.0.0/p.html' },
  ])('names no page for $description', ({ href }) => {
    expect(DocumentationAddress.parseFrame(href, origin)).toBeNull()
  })
})

describe('DocumentationAddress forms', () => {
  test('the frame form reaches the file', () => {
    expect(parse('/proj/1.0.0/api/docs.html?tab=examples#code').frameHref).toBe(
      '/static/projects/proj/1.0.0/api/docs.html?tab=examples#code'
    )
  })

  test('the readable form names the page the way vdoc does', () => {
    expect(parse('/static/projects/proj/1.0.0/api/docs.html?tab=examples#code').readableHref).toBe(
      '/proj/1.0.0/api/docs.html?tab=examples#code'
    )
  })

  test('a framework that restored the authored address is not prefixed twice', () => {
    // GIVEN: The address the documentation authored, which a re-render puts back on the anchor
    const authored = '/static/projects/proj/1.0.0/page.html'

    // WHEN/THEN: Reading it again arrives at the same file rather than at a second prefix
    expect(parse(authored).frameHref).toBe(authored)
  })

  test('going to the readable form and back arrives at the same file', () => {
    // GIVEN: The address of a documentation file, with a query and a hash
    const frameHref = '/static/projects/proj/1.0.0/api/docs.html?tab=examples#code'

    // WHEN/THEN: A rewritten anchor can be navigated without remembering anything about it
    expect(parse(parse(frameHref).readableHref).frameHref).toBe(frameHref)
  })
})

describe('DocumentationAddress.frameUrl', () => {
  test.each([
    {
      description: 'appends the color mode to a plain page',
      href: '/proj/1.0.0/page.html',
      params: { mode: 'dark' as const },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?vdoc-theme=dark',
    },
    {
      description: 'appends the color mode after a query the page already carries',
      href: '/proj/1.0.0/page.html?q=search',
      params: { mode: 'light' as const },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search&vdoc-theme=light',
    },
    {
      description: 'keeps the hash last',
      href: '/proj/1.0.0/page.html?q=search#section',
      params: { mode: 'dark' as const },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/page.html?q=search&vdoc-theme=dark#section',
    },
    {
      description: 'keeps a trailing slash, which is part of the address to request',
      href: '/proj/1.0.0/guide/',
      params: { mode: 'dark' as const },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/guide/?vdoc-theme=dark',
    },
    {
      description: 'replaces a stale mode and inset rather than adding a second one',
      href: '/static/projects/proj/1.0.0/p.html?vdoc-theme=light&vdoc-inset=16',
      params: { mode: 'dark' as const, inset: 24 },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/p.html?vdoc-theme=dark&vdoc-inset=24',
    },
    {
      description: 'rounds a fractional inset, since the parameter is whole pixels',
      href: '/proj/1.0.0/p.html',
      params: { mode: 'light' as const, inset: 23.6 },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/p.html?vdoc-theme=light&vdoc-inset=24',
    },
    {
      description: 'omits the inset while it has not been measured',
      href: '/proj/1.0.0/p.html',
      params: { mode: 'dark' as const, inset: 0 },
      expected: 'http://localhost:3000/static/projects/proj/1.0.0/p.html?vdoc-theme=dark',
    },
  ])('$description', ({ href, params, expected }) => {
    expect(parse(href).frameUrl(params, origin)).toBe(expected)
  })

  test('the URL the frame is loaded with is the same page as the address it was made from', () => {
    // GIVEN: An address vdoc loaded into the frame
    const address = parse('/proj/1.0.0/page.html?q=search#section')
    const loaded = parse(address.frameUrl({ mode: 'dark', inset: 24 }, origin))

    // WHEN/THEN: A frame sitting on exactly the address it was given never looks stale
    expect(loaded.isSamePage(address)).toBe(true)
  })
})

describe('DocumentationAddress.isSamePage', () => {
  test.each([
    {
      description: 'the frame form and the readable form',
      one: '/static/projects/proj/1.0.0/page.html',
      other: '/proj/1.0.0/page.html',
    },
    {
      description: 'a page reached through a redirect that adds a trailing slash',
      one: '/static/projects/proj/1.0.0/guide',
      other: '/static/projects/proj/1.0.0/guide/',
    },
    {
      description: 'a page framed at two viewport widths and in two color modes',
      one: '/static/projects/proj/1.0.0/p.html?vdoc-theme=dark&vdoc-inset=16',
      other: '/static/projects/proj/1.0.0/p.html?vdoc-theme=light&vdoc-inset=24',
    },
    {
      description: 'a bare fragment, which the router drops, and no fragment',
      one: '/static/projects/proj/1.0.0/page#',
      other: '/proj/1.0.0/page',
    },
    {
      description: 'a query the router serialized again',
      one: '/static/projects/proj/1.0.0/page?_highlight=alpha&tab=api&_highlight=beta%20gamma',
      other: `/proj/1.0.0/page${stringifySearch(parseSearch('_highlight=alpha&tab=api&_highlight=beta%20gamma'))}`,
    },
  ])('holds for $description', ({ one, other }) => {
    expect(parse(one).isSamePage(parse(other))).toBe(true)
  })

  test.each([
    { description: 'two different pages', one: '/proj/1.0.0/guide', other: '/proj/1.0.0/api' },
    { description: 'two versions', one: '/proj/1.0.0/guide', other: '/proj/2.0.0/guide' },
    { description: 'two queries', one: '/proj/1.0.0/page?tab=a', other: '/proj/1.0.0/page?tab=b' },
    { description: 'two fragments', one: '/proj/1.0.0/page#one', other: '/proj/1.0.0/page#two' },
  ])('does not hold for $description', ({ one, other }) => {
    expect(parse(one).isSamePage(parse(other))).toBe(false)
  })
})

describe('DocumentationAddress.isSameDocument', () => {
  test('holds for two fragments of one document, in either form', () => {
    expect(
      parse('/static/projects/proj/1.0.0/guide/?vdoc-theme=dark#one').isSameDocument(parse('/proj/1.0.0/guide#two'))
    ).toBe(true)
  })

  test('does not hold for two documents', () => {
    expect(parse('/proj/1.0.0/guide#one').isSameDocument(parse('/proj/1.0.0/api#one'))).toBe(false)
  })
})

describe('toReadableHref', () => {
  test.each([
    {
      description: 'strips the frame prefix, so the address names the page rather than the file',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/proj/1.0.0/page.html',
    },
    {
      description: 'resolves a relative address against the origin',
      href: '/static/projects/proj/1.0.0/page.html',
      expected: 'http://localhost:3000/proj/1.0.0/page.html',
    },
    {
      description: 'keeps a bare fragment on its page',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/page.html#',
      expected: 'http://localhost:3000/proj/1.0.0/page.html#',
    },
    {
      description: 'drops the parameters of vdoc from a fragment link, which resolves against the whole address',
      href: 'http://localhost:3000/static/projects/proj/1.0.0/?vdoc-theme=dark&vdoc-inset=24#section1',
      expected: 'http://localhost:3000/proj/1.0.0/#section1',
    },
    {
      description: 'leaves an address that is already readable alone',
      href: 'http://localhost:3000/proj/1.0.0/page.html?q=search',
      expected: 'http://localhost:3000/proj/1.0.0/page.html?q=search',
    },
    {
      description: 'leaves an external address verbatim',
      href: 'https://example.com',
      expected: 'https://example.com',
    },
    {
      description: 'leaves a mail address verbatim',
      href: 'mailto:someone@example.com',
      expected: 'mailto:someone@example.com',
    },
  ])('$description', ({ href, expected }) => {
    expect(toReadableHref(href, origin)).toBe(expected)
  })
})
