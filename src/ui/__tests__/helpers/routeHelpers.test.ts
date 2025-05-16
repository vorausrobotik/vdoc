import { expect, test, describe } from 'vitest'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'

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
