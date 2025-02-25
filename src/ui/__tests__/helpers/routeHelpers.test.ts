import { expect, test, describe } from 'vitest'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'

describe('sanitizeDocuUri', () => {
  test('sanitizes valid uris as expected', () => {
    const basePath = 'http://localhost:8080'
    const testData = [
      {
        input: {
          href: `${basePath}/project-one/6.0/index.html#`,
          projectName: 'project-one',
          projectVersion: '6.0',
        },
        expected: {
          projectName: 'project-one',
          version: '6.0',
          _splat: 'index.html#',
          href: `${basePath}/project-one/6.0/index.html#`,
        },
      },
      {
        input: {
          href: `${basePath}/meta-project/1.3.0/#`,
          projectName: 'meta-project',
          projectVersion: '1.3.0',
        },
        expected: {
          projectName: 'meta-project',
          version: '1.3.0',
          _splat: '#',
          href: `${basePath}/meta-project/1.3.0/#`,
        },
      },
      {
        input: {
          href: `${basePath}/meta-project/1.3.0`,
          projectName: 'meta-project',
          projectVersion: '1.3.0',
        },
        expected: {
          projectName: 'meta-project',
          version: '1.3.0',
          _splat: '',
          href: `${basePath}/meta-project/1.3.0`,
        },
      },
      {
        input: {
          href: `${basePath}/project-one/latest/examples.html#examples`,
          projectName: 'project-one',
          projectVersion: 'latest',
        },
        expected: {
          projectName: 'project-one',
          version: 'latest',
          _splat: 'examples.html#examples',
          href: `${basePath}/project-one/latest/examples.html#examples`,
        },
      },
      {
        input: {
          href: `${basePath}/static/projects/project-one/latest/examples.html#examples`,
          projectName: 'project-one',
          projectVersion: 'latest',
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
      expect(sanitizeDocuUri(input.href, basePath, input.projectName, input.projectVersion)).toStrictEqual(expected)
    })
  })
  test('sanitizing invalid or external uris must throw errors', () => {
    const basePath = 'http://localhost:8080'
    const testData = ['https://google.com', 'http://localhost:9000']
    testData.forEach((href) => {
      expect(() => sanitizeDocuUri(href, basePath, '', '')).toThrowError(`Unable to sanitize doc URI ${href}`)
    })
  })
})
