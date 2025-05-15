import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { openProjectDocumentation, assertLinksOnPage, assertLinkOpensInNewTab, BASE_URL } from './helpers'

await prepareTestSuite(test)

test('Test link substitution', async ({ page }) => {
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest')

  // Expect the documentation iframe to display the mocked documentation page
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  // Ensure that all links have been substituted correctly
  let linkLocators = await assertLinksOnPage(documentation, [
    `${baseUrl}/#`,
    `${baseUrl}/index.html`,
    `${baseUrl}/examples.html`,
    'https://www.sphinx-doc.org/',
    'https://example.com/',
  ])

  await (await assertLinkOpensInNewTab(page, linkLocators.last(), 'https://example.com/')).close()

  // Go to the examples page
  await linkLocators.nth(2).click()
  await expect(page).toHaveURL(`${baseUrl}/examples.html`)

  linkLocators = await assertLinksOnPage(documentation, [`${baseUrl}/index.html`])

  await linkLocators.first().click()
  await expect(page).toHaveURL(`${baseUrl}/index.html`)

  linkLocators = await assertLinksOnPage(documentation, [
    `${baseUrl}/index.html#`,
    `${baseUrl}/index.html`,
    `${baseUrl}/examples.html`,
    'https://www.sphinx-doc.org/',
    'https://example.com/',
  ])
  await (await assertLinkOpensInNewTab(page, linkLocators.last(), 'https://example.com/')).close()
})
