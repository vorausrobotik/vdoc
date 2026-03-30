import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { openProjectDocumentation, assertLinksOnPage, assertLinkOpensInNewTab, BASE_URL } from './helpers'

await prepareTestSuite(test)

test('Test link substitution', async ({ page }) => {
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')

  // Expect the documentation iframe to display the mocked documentation page
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  // Ensure that all links have been substituted correctly
  let linkLocators = await assertLinksOnPage(documentation, [
    `${baseUrl}/#`,
    `${baseUrl}/index.html`,
    `${baseUrl}/examples.html`,
    `${baseUrl}/search.html`,
    'https://www.sphinx-doc.org/',
    'https://example.com/',
    `${baseUrl}/#section1`,
    `${baseUrl}/#section2`,
    `${baseUrl}/#section3`,
  ])

  await (await assertLinkOpensInNewTab(page, linkLocators.nth(5), 'https://example.com/')).close()

  // Go to the examples page
  await linkLocators.nth(2).click()
  await page.waitForLoadState()
  await expect(page).toHaveURL(`${baseUrl}/examples.html`)

  linkLocators = await assertLinksOnPage(documentation, [`${baseUrl}/index.html`, `${baseUrl}/examples.html#example2`])

  await linkLocators.first().click()
  await page.waitForLoadState()
  await expect(page).toHaveURL(`${baseUrl}/index.html`)

  linkLocators = await assertLinksOnPage(documentation, [
    `${baseUrl}/index.html#`,
    `${baseUrl}/index.html`,
    `${baseUrl}/examples.html`,
    `${baseUrl}/search.html`,
    'https://www.sphinx-doc.org/',
    'https://example.com/',
    `${baseUrl}/index.html#section1`,
    `${baseUrl}/index.html#section2`,
    `${baseUrl}/index.html#section3`,
  ])
  await (await assertLinkOpensInNewTab(page, linkLocators.nth(5), 'https://example.com/')).close()
})
