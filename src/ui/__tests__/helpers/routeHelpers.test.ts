import { expect, test, describe } from 'vitest'
import { sanitizeDocuUri } from '../../helpers/RouteHelpers'

describe('sanitizeDocuUri', () => {
  test('sanitizes uris as expected', () => {
    const basePath = 'http://localhost:8080'
    const testData = [
      {
        input: `${basePath}/project-one/6.0/index.html#`,
        expected: {
          isInternal: true,
          project: 'project-one',
          remainder: 'index.html#',
          version: '6.0',
        },
      },
      {
        input: `${basePath}/meta-project/1.3.0/#`,
        expected: {
          isInternal: true,
          project: 'meta-project',
          remainder: '#',
          version: '1.3.0',
        },
      },
      {
        input: `${basePath}/meta-project/1.3.0`,
        expected: {
          isInternal: true,
          project: 'meta-project',
          remainder: undefined,
          version: '1.3.0',
        },
      },
      {
        input: `${basePath}/project-one/latest/examples.html#examples`,
        expected: {
          isInternal: true,
          project: 'project-one',
          remainder: 'examples.html#examples',
          version: 'latest',
        },
      },
      {
        input: 'https://www.sphinx-doc.org/',
        expected: {
          isInternal: false,
        },
      },
    ]
    testData.forEach(({ input, expected }) => {
      expect(sanitizeDocuUri(input, basePath)).toStrictEqual(expected)
    })
  })
})
