import fs from 'node:fs'
import { expect, type Locator, type Page } from '@playwright/test'
import testIDs from '@/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from './base'
import { BASE_URL, openProjectDocumentation } from './helpers'

await prepareTestSuite(test)

const BASE_PATH = `${BASE_URL}/example-project-01/3.2.0`

/**
 * Serves the search parameter fixture for every page of example-project-01.
 *
 * Registered inside the test body so that it takes priority over the catch-all route from
 * ``prepareTestSuite``, which serves the static documentation fixture.
 */
const serveFixture = async (page: Page) => {
  await page.route(/\/static\/projects\/example-project-01\//, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: fs.readFileSync('tests/ui/resources/mockedFrameSearchParams.html'),
    })
  )
}

/** The values the framed page reads back for `_highlight`, the way the search plugin does. */
const frameHighlights = async (page: Page): Promise<string[]> =>
  await page
    .getByTestId(testIDs.project.documentation.documentationIframe)
    .evaluate((iframe: HTMLIFrameElement) =>
      new URLSearchParams(iframe.contentWindow?.location.search).getAll('_highlight')
    )

/** Marks the framed window, so that a later check can tell whether the frame was reloaded. */
const markFramedDocument = async (documentation: Locator) => {
  await documentation.evaluate((html: HTMLElement) => {
    ;(html.ownerDocument.defaultView as unknown as Record<string, unknown>).__vdocTestMarker = 'kept'
  })
}

const framedDocumentMarker = async (documentation: Locator): Promise<unknown> =>
  await documentation.evaluate(
    (html: HTMLElement) => (html.ownerDocument.defaultView as unknown as Record<string, unknown>).__vdocTestMarker
  )

test('A repeated search parameter of the frame reaches the address bar unchanged', async ({ page }) => {
  // GIVEN: A framed page whose search plugin keeps its words in repeated keys
  await serveFixture(page)
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  await markFramedDocument(documentation)

  // WHEN: The plugin records two words
  await documentation.getByRole('button', { name: 'Highlight two words' }).click()

  // THEN: vdoc's address bar carries both, in order
  await expect(page).toHaveURL(`${BASE_PATH}?_highlight=alpha&_highlight=beta`)

  // AND: The frame still reads both words back
  await expect.poll(async () => await frameHighlights(page)).toStrictEqual(['alpha', 'beta'])

  // AND: The frame was not reloaded for it
  expect(await framedDocumentMarker(documentation)).toBe('kept')
})

test('A search parameter the frame removes disappears from the address bar', async ({ page }) => {
  // GIVEN: A framed page with two recorded words
  await serveFixture(page)
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  await documentation.getByRole('button', { name: 'Highlight two words' }).click()
  await expect(page).toHaveURL(`${BASE_PATH}?_highlight=alpha&_highlight=beta`)
  await markFramedDocument(documentation)

  // WHEN: The plugin clears them
  await documentation.getByRole('button', { name: 'Clear the highlight' }).click()

  // THEN: vdoc's address bar drops them as well
  await expect(page).toHaveURL(BASE_PATH)

  // AND: Once the page has settled, the frame has not been sent back to the words
  await page.waitForLoadState('networkidle')
  expect(await frameHighlights(page)).toStrictEqual([])

  // AND: The frame was not reloaded for it
  expect(await framedDocumentMarker(documentation)).toBe('kept')
})

test('A readable address with a repeated search parameter hands both values to the frame', async ({ page }) => {
  // GIVEN: A framed page whose search plugin keeps its words in repeated keys
  await serveFixture(page)

  // WHEN: The reader opens an address that carries two words
  await page.goto(`${BASE_PATH}/index.html?_highlight=alpha&_highlight=beta`)

  // THEN: The frame reads both words back
  await expect.poll(async () => await frameHighlights(page)).toStrictEqual(['alpha', 'beta'])

  // AND: The address bar keeps them
  await expect(page).toHaveURL(`${BASE_PATH}/index.html?_highlight=alpha&_highlight=beta`)
})
