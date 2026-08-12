import { expect, type Locator } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { assertLinkOpensInNewTab, assertLinksOnPage, BASE_URL, openProjectDocumentation } from './helpers'

await prepareTestSuite(test)

const BASE_PATH = `${BASE_URL}/example-project-01/3.2.0`

/**
 * Waits until vdoc has taken charge of the links in the framed document.
 *
 * ``openProjectDocumentation`` returns as soon as the document is on screen, which is before the
 * load handler that installs the delegated click listeners has run. vdoc rewriting the addresses
 * the documentation authored is the observable half of that same step, so waiting for it is
 * waiting for the listeners. Appending a link and clicking it any earlier races them, and the
 * click then falls through to the browser instead of reaching vdoc.
 */
const waitForFramedLinkHandling = async (documentation: Locator): Promise<void> => {
  await expect(documentation.getByRole('link').nth(1)).toHaveAttribute('href', `${BASE_PATH}/index.html`)
}

/** Appends a link to the framed document, the way a client-side framework renders one late. */
const renderLinkAfterLoad = async (documentation: Locator, href: string, text: string): Promise<Locator> => {
  await documentation.evaluate(
    (html: HTMLElement, link: { href: string; text: string }) => {
      const anchor = html.ownerDocument.createElement('a')
      anchor.href = link.href
      anchor.textContent = link.text
      html.querySelector('body')?.appendChild(anchor)
    },
    { href, text }
  )
  return documentation.getByRole('link', { name: text })
}

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

test('Test a link rendered after the document loaded still navigates', async ({ page }) => {
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  await waitForFramedLinkHandling(documentation)

  // GIVEN: A link the documentation renders only after its document has loaded, which is what a
  // client-side framework does and what the per-anchor rewriting never reached
  const lateLink = await renderLinkAfterLoad(
    documentation,
    '/static/projects/example-project-01/3.2.0/examples.html',
    'Late link'
  )

  // WHEN: The reader clicks it
  await lateLink.click()
  await page.waitForLoadState()

  // THEN: It navigates, rather than sending vdoc's own application into the frame
  await expect(page).toHaveURL(`${BASE_PATH}/examples.html`)
  await expect(documentation).toContainText('This is a mocked examples page')
})

test('Test links to another project open in a new tab', async ({ page }) => {
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  await waitForFramedLinkHandling(documentation)

  // GIVEN: A link to another project's documentation, rendered after the document has loaded
  const otherProjectLink = await renderLinkAfterLoad(
    documentation,
    '/static/projects/example-project-02/1.0.0/index.html',
    'Other project'
  )

  // WHEN/THEN: Clicking it opens vdoc's readable address for that project in a new tab,
  // instead of taking over the frame or showing the bare documentation file
  const newTab = await assertLinkOpensInNewTab(
    page,
    otherProjectLink,
    `${BASE_URL}/example-project-02/1.0.0/index.html`
  )
  await newTab.close()
})
