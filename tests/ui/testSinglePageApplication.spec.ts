import fs from 'node:fs'
import { expect, type Locator, type Page } from '@playwright/test'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from './base'
import { assertLinkOpensInNewTab, BASE_URL, openProjectDocumentation } from './helpers'

await prepareTestSuite(test)

const BASE_PATH = `${BASE_URL}/example-project-01/3.2.0`

/**
 * Serves the single page application fixture for every page of example-project-01.
 *
 * Registered inside the test body so that it takes priority over the catch-all route from
 * ``prepareTestSuite``, which serves the static documentation fixture.
 */
const serveSinglePageApp = async (page: Page) => {
  // A regular expression rather than a glob, so that a trailing slash or a query string cannot make
  // a request fall through to the dev server, which answers anything it does not know with vdoc's
  // own application - inside the frame that reads as a documentation page and recurses.
  await page.route(/\/static\/projects\/example-project-01\//, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: fs.readFileSync('tests/ui/resources/mockedSinglePageApp.html'),
    })
  )
}

const openSinglePageApp = async (page: Page): Promise<Locator> => {
  await serveSinglePageApp(page)
  return await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
}

/** The page the fixture currently renders, as opposed to the one the address bar names. */
const renderedPage = (documentation: Locator): Locator => documentation.locator('[data-page]')

/**
 * Marks the framed window, so that a later check can tell a client-side navigation from one that
 * discarded the document.
 */
const markFramedDocument = async (documentation: Locator) => {
  await documentation.evaluate((html: HTMLElement) => {
    ;(html.ownerDocument.defaultView as unknown as Record<string, unknown>).__vdocTestMarker = 'kept'
  })
}

const framedDocumentMarker = async (documentation: Locator): Promise<unknown> =>
  await documentation.evaluate(
    (html: HTMLElement) => (html.ownerDocument.defaultView as unknown as Record<string, unknown>).__vdocTestMarker
  )

test('Client-side navigation updates the address bar and the title without reloading', async ({ page }) => {
  // GIVEN: A single page documentation whose window is marked
  const documentation = await openSinglePageApp(page)
  await markFramedDocument(documentation)

  // WHEN: The reader clicks a link the application routes itself
  await documentation.getByRole('link', { name: 'Go to the guide' }).click()

  // THEN: vdoc's address bar and the browser title follow
  await expect(page).toHaveURL(`${BASE_PATH}/guide.html`)
  await expect(page).toHaveTitle('SPA Guide')
  await expect(renderedPage(documentation)).toHaveAttribute('data-page', 'guide.html')

  // AND: No document was discarded on the way, so this really was client-side routing
  expect(await framedDocumentMarker(documentation)).toBe('kept')
})

test('Reloading vdoc at a client-side navigated address returns the same page', async ({ page }) => {
  // GIVEN: A reader who navigated to the API page client-side
  const documentation = await openSinglePageApp(page)
  await documentation.getByRole('link', { name: 'Go to the API' }).click()
  await expect(page).toHaveURL(`${BASE_PATH}/api.html`)

  // WHEN: They reload, or share the address and someone else opens it
  await page.reload()
  await page.waitForLoadState()

  // THEN: The same page comes back
  await expect(page).toHaveURL(`${BASE_PATH}/api.html`)
  await expect(renderedPage(documentation)).toHaveAttribute('data-page', 'api.html')
  await expect(page).toHaveTitle('SPA API')
})

test('In-frame back and forward are followed by the address bar', async ({ page }) => {
  // GIVEN: A reader who walked through two pages client-side
  const documentation = await openSinglePageApp(page)
  await documentation.getByRole('link', { name: 'Go to the guide' }).click()
  await expect(page).toHaveURL(`${BASE_PATH}/guide.html`)
  await documentation.getByRole('link', { name: 'Go to the API' }).click()
  await expect(page).toHaveURL(`${BASE_PATH}/api.html`)

  // WHEN: They go back
  await page.goBack()

  // THEN: Both the rendered page and the address bar are one step back, after a single click
  await expect(page).toHaveURL(`${BASE_PATH}/guide.html`)
  await expect(renderedPage(documentation)).toHaveAttribute('data-page', 'guide.html')

  // WHEN: They go back once more
  await page.goBack()

  // THEN: They are on the page they started from
  await expect(page).toHaveURL(BASE_PATH)
  await expect(renderedPage(documentation)).toHaveAttribute('data-page', 'index.html')

  // WHEN: They go forward again
  await page.goForward()

  // THEN: The address bar and the rendered page follow
  await expect(page).toHaveURL(`${BASE_PATH}/guide.html`)
  await expect(renderedPage(documentation)).toHaveAttribute('data-page', 'guide.html')
})

test('In-page anchors are reflected in the address bar', async ({ page }) => {
  // GIVEN: A reader on a client-side navigated page
  const documentation = await openSinglePageApp(page)
  await documentation.getByRole('link', { name: 'Go to the guide' }).click()
  await expect(page).toHaveURL(`${BASE_PATH}/guide.html`)

  const chapter2 = documentation.locator('#chapter2')
  await expect(chapter2).not.toBeInViewport()

  // WHEN: They jump to a chapter within that page
  await documentation.getByRole('link', { name: 'Jump to chapter 2' }).click()

  // THEN: The hash is in vdoc's address bar and the chapter is on screen, rather than the reader
  // being sent back to the top of the page
  await expect(page).toHaveURL(`${BASE_PATH}/guide.html#chapter2`)
  await expect(chapter2).toBeInViewport()
})

test('Search parameters of a client-side navigation reach vdocs address bar', async ({ page }) => {
  // GIVEN: A single page documentation
  const documentation = await openSinglePageApp(page)

  // WHEN: The application routes to a page with a search parameter
  await documentation.getByRole('link', { name: 'Go to the index with a search parameter' }).click()

  // THEN: The parameter shows up in vdoc's address bar
  await expect(page).toHaveURL(`${BASE_PATH}/index.html?tab=examples`)
})

test('A page published as a directory is not reloaded in a loop', async ({ page }) => {
  // GIVEN: A page published as a directory, the way Docusaurus publishes every page: requesting it
  // without the trailing slash normalizes the address to the form with one, while the slash is not
  // part of the splat vdoc's own router parses back out of its address bar
  await serveSinglePageApp(page)

  let documentLoads = 0
  page.on('request', (request) => {
    if (request.resourceType() === 'document' && request.url().includes('/static/projects/')) {
      documentLoads += 1
    }
  })

  // WHEN: The reader opens that page
  await page.goto(`${BASE_PATH}/guide`)
  await page.waitForLoadState()
  await page.waitForTimeout(3000)

  // THEN: The frame was fetched once and settled, rather than reloading for as long as it is open
  expect(documentLoads).toBeGreaterThan(0)
  expect(documentLoads).toBeLessThanOrEqual(2)

  // AND: The documentation is actually on screen
  const documentation = page
    .getByTestId(testIDs.project.documentation.documentationIframe)
    .contentFrame()
    .locator('html')
  await expect(documentation.locator('h1')).toBeVisible()
})

test('Foreign links of a single page app open in a new tab', async ({ page }) => {
  // GIVEN: A single page documentation
  const documentation = await openSinglePageApp(page)

  // WHEN/THEN: A link to another project opens in a new tab, at vdoc's readable address
  const otherProject = await assertLinkOpensInNewTab(
    page,
    documentation.getByRole('link', { name: 'Go to another project' }),
    `${BASE_URL}/example-project-02/1.0.0/index.html`
  )
  await otherProject.close()

  // AND: So does an external link
  const externalSite = await assertLinkOpensInNewTab(
    page,
    documentation.getByRole('link', { name: 'Go to an external site' }),
    'https://example.com/'
  )
  await externalSite.close()

  // AND: The frame itself stayed where it was
  await expect(page).toHaveURL(BASE_PATH)
  await expect(renderedPage(documentation)).toHaveAttribute('data-page', 'index.html')
})
