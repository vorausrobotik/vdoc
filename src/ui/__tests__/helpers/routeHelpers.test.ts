import { expect, test, describe } from 'vitest'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'

describe('sanitizeDocuUri', () => {
  test('sanitizes uris as expected', () => {
    const basePath = 'http://localhost:8080'
    const testData = [
      {
        input: {
          href: `${basePath}/project-one/6.0/index.html#`,
          projectName: 'project-one',
          projectVersion: '6.0',
        },
        expected: {
          isInternal: true,
          project: 'project-one',
          remainder: 'index.html#',
          version: '6.0',
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
          isInternal: true,
          project: 'meta-project',
          remainder: '#',
          version: '1.3.0',
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
          isInternal: true,
          project: 'meta-project',
          remainder: undefined,
          version: '1.3.0',
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
          isInternal: true,
          project: 'project-one',
          remainder: 'examples.html#examples',
          version: 'latest',
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
          isInternal: true,
          project: 'project-one',
          remainder: 'examples.html#examples',
          version: 'latest',
          href: `${basePath}/project-one/latest/examples.html#examples`,
        },
      },
      {
        input: {
          href: 'https://www.sphinx-doc.org/',
          projectName: 'example-project',
          projectVersion: "doesn't matter",
        },
        expected: {
          isInternal: false,
          href: 'https://www.sphinx-doc.org/',
        },
      },
    ]
    testData.forEach(({ input, expected }) => {
      expect(sanitizeDocuUri(input.href, basePath, input.projectName, input.projectVersion)).toStrictEqual(expected)
    })
  })
})
