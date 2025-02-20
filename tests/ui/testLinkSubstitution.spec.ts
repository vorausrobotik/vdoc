import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { openProjectDocumentation, assertLinksOnPage } from './helpers'

await prepareTestSuite(test)

test('Test link substitution', async ({ page }) => {
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest')

  // Expect the documentation iframe to display the mocked documentation page
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  // Ensure that all links have been substituted correctly
  let linkLocators = await assertLinksOnPage(documentation, [
    'http://localhost:3000/example-project-01/latest/#',
    'http://localhost:3000/example-project-01/latest/index.html',
    'http://localhost:3000/example-project-01/latest/examples.html',
    'https://www.sphinx-doc.org/',
  ])
})
