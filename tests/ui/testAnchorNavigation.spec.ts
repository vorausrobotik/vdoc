import { expect, type Locator, type Page } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { BASE_URL, openProjectDocumentation, recordFrameDocumentLoads, waitUntilQuiet } from './helpers'

await prepareTestSuite(test)

test('Test anchor navigation - direct URL with hash', async ({ page }) => {
  // GIVEN: The user navigates directly to a URL with an anchor
  await page.goto('/example-project-01/3.2.0/index.html#section1')
  await page.waitForLoadState()

  // THEN: The URL should contain the hash
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/3.2.0/index.html#section1`)

  // AND: The page should have scrolled to the section
  const iframe = page.getByTestId('project.documentation.documentationIframe')
  const section1 = iframe.contentFrame().locator('#section1')
  await expect(section1).toBeInViewport()
})

test('Test anchor navigation - clicking anchor link on same page', async ({ page }) => {
  // GIVEN: The user opens a documentation page
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  // THEN: The documentation main page must be shown
  await expect(page).toHaveURL(baseUrl)
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  // AND: Section 1 is not visible (it's far down the page)
  const section1 = documentation.locator('#section1')
  await expect(section1).not.toBeInViewport()

  // WHEN: The user clicks on an anchor link
  await documentation.getByRole('link', { name: /Jump to Section 1/i }).click()

  // THEN: The URL should contain the hash
  await expect(page).toHaveURL(`${baseUrl}#section1`)

  // AND: The page should have scrolled to the section
  await expect(section1).toBeInViewport()
})

test('Test anchor navigation - clicking anchor link to another page', async ({ page }) => {
  // GIVEN: The user is on the index page
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  // WHEN: The user navigates to the examples page
  await documentation.getByRole('link', { name: /examples\.html/i }).click()
  await page.waitForLoadState()
  await expect(page).toHaveURL(`${baseUrl}/examples.html`)

  // AND: Example 2 is not visible (it's far down the page)
  const example2 = documentation.locator('#example2')
  await expect(example2).not.toBeInViewport()

  // AND: The user clicks on a link with an anchor
  await documentation.getByRole('link', { name: /Jump to Example 2/i }).click()

  // THEN: The URL should contain the hash
  await expect(page).toHaveURL(`${baseUrl}/examples.html#example2`)

  // AND: The page should have scrolled to the section
  await expect(example2).toBeInViewport()
})

test('Test anchor navigation - browser back/forward with anchors', async ({ page }) => {
  // GIVEN: The user opens a documentation page
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  const section1 = documentation.locator('#section1')
  const section2 = documentation.locator('#section2')

  // AND: Sections are not visible
  await expect(section1).not.toBeInViewport()
  await expect(section2).not.toBeInViewport()

  // WHEN: The user clicks on an anchor link
  await documentation.getByRole('link', { name: /Jump to Section 1/i }).click()
  await expect(page).toHaveURL(`${baseUrl}#section1`)
  await expect(section1).toBeInViewport()

  // AND: The user clicks on another anchor link
  await documentation.getByRole('link', { name: /Jump to Section 2/i }).click()
  await expect(page).toHaveURL(`${baseUrl}#section2`)
  await expect(section2).toBeInViewport()

  // WHEN: The user navigates back
  await page.goBack()

  // THEN: The previous anchor should be in the URL and section visible
  await expect(page).toHaveURL(`${baseUrl}#section1`)
  await expect(section1).toBeInViewport()

  // WHEN: The user navigates forward
  await page.goForward()

  // THEN: The next anchor should be in the URL and section visible
  await expect(page).toHaveURL(`${baseUrl}#section2`)
  await expect(section2).toBeInViewport()
})

test('Test anchor navigation - empty hash should be removed', async ({ page }) => {
  // GIVEN: The user opens a documentation page
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  const section1 = documentation.locator('#section1')
  await expect(section1).not.toBeInViewport()

  // WHEN: The user clicks on an anchor link
  await documentation.getByRole('link', { name: /Jump to Section 1/i }).click()
  await expect(page).toHaveURL(`${baseUrl}#section1`)
  await expect(section1).toBeInViewport()

  // AND: The user clicks on a link with empty hash
  await documentation.getByRole('link', { name: /Link with href '#'/i }).click()

  // THEN: The URL should not have a hash
  await expect(page).toHaveURL(baseUrl)
})

const latestRedirectTestCases = [
  {
    name: 'hash only',
    url: '/example-project-01/latest/index.html#section2',
    expectedUrl: '/example-project-01/3.2.0/index.html#section2',
    elementToCheck: '#section2',
  },
  {
    name: 'hash without page',
    url: '/example-project-01/latest/#section1',
    expectedUrl: '/example-project-01/3.2.0#section1',
    elementToCheck: '#section1',
  },
  {
    name: 'search params only',
    url: '/example-project-01/latest/index.html?foo=bar&baz=qux',
    expectedUrl: '/example-project-01/3.2.0/index.html?foo=bar&baz=qux',
    elementToCheck: null,
  },
  {
    name: 'search params and hash',
    url: '/example-project-01/latest/index.html?search=test#section2',
    expectedUrl: '/example-project-01/3.2.0/index.html?search=test#section2',
    elementToCheck: '#section2',
  },
]

for (const testCase of latestRedirectTestCases) {
  test(`/latest/ redirect preserves ${testCase.name}`, async ({ page }) => {
    await page.goto(testCase.url)
    await page.waitForLoadState()

    await expect(page).toHaveURL(`${BASE_URL}${testCase.expectedUrl}`)

    const iframe = page.getByTestId('project.documentation.documentationIframe')
    await expect(iframe.contentFrame().locator('html')).toContainText(
      'Hello, this is a mocked documentation component.'
    )

    if (testCase.elementToCheck) {
      const element = iframe.contentFrame().locator(testCase.elementToCheck)
      await expect(element).toBeInViewport()
    }
  })
}

const BASE_PATH = `${BASE_URL}/example-project-01/3.2.0`
const INDEX = `${BASE_PATH}/index.html`

/** The document in vdoc's frame, whichever document that currently is. */
const framedDocument = (page: Page): Locator =>
  page.getByTestId('project.documentation.documentationIframe').contentFrame().locator('html')

/**
 * The ways a reader reaches the index of a documentation that loads a document for every page, the way
 * Sphinx does. Only a document vdoc loaded itself carries vdoc's frame parameters, so each way leaves
 * the frame at a differently shaped address.
 */
const arrivals: { name: string; reachIndex: (page: Page) => Promise<Locator> }[] = [
  {
    name: 'opened directly',
    reachIndex: async (page) => {
      await page.goto(INDEX)
      return framedDocument(page)
    },
  },
  {
    name: 'reached through a link',
    reachIndex: async (page) => {
      await page.goto(`${BASE_PATH}/examples.html`)
      const documentation = framedDocument(page)
      await documentation.getByRole('link', { name: "Take me back to 'index.html'" }).click()
      return documentation
    },
  },
  {
    name: 'reached by going back',
    reachIndex: async (page) => {
      await page.goto(INDEX)
      const documentation = framedDocument(page)
      await documentation.getByRole('link', { name: "Link with href 'examples.html'" }).click()
      await expect(page).toHaveURL(`${BASE_PATH}/examples.html`)
      await page.goBack()
      return documentation
    },
  },
]

/** Settles the frame on the index, and starts counting the documents it loads from here on. */
const settleOnIndex = async (page: Page, documentation: Locator): Promise<string[]> => {
  await expect(page).toHaveURL(INDEX)
  await expect(documentation.locator('#section1')).toBeAttached()
  const documentLoads = recordFrameDocumentLoads(page)
  await waitUntilQuiet(page, documentLoads)
  documentLoads.length = 0
  return documentLoads
}

for (const arrival of arrivals) {
  test(`Following a fragment link on a page ${arrival.name} loads no document and takes one step back`, async ({
    page,
  }) => {
    // GIVEN: A reader on the index, with the frame settled
    const documentation = await arrival.reachIndex(page)
    const documentLoads = await settleOnIndex(page, documentation)

    // WHEN: They jump to a section of the index
    await documentation.getByRole('link', { name: 'Jump to Section 1' }).click()

    // THEN: The section is on screen, without a document load
    await expect(page).toHaveURL(`${INDEX}#section1`)
    await expect(documentation.locator('#section1')).toBeInViewport()
    await waitUntilQuiet(page, documentLoads)
    expect(documentLoads).toHaveLength(0)

    // AND: A single back returns to the index
    await page.goBack()
    await expect(page).toHaveURL(INDEX)
  })

  test(`Following a link to another page ${arrival.name} loads one document and takes one step back`, async ({
    page,
  }) => {
    // GIVEN: A reader on the index, with the frame settled
    const documentation = await arrival.reachIndex(page)
    const documentLoads = await settleOnIndex(page, documentation)

    // WHEN: They follow a link to another page
    await documentation.getByRole('link', { name: "Link with href 'examples.html'" }).click()

    // THEN: The other page is shown, loaded once
    await expect(page).toHaveURL(`${BASE_PATH}/examples.html`)
    await expect(documentation.locator('#example1')).toBeAttached()
    await waitUntilQuiet(page, documentLoads)
    expect(documentLoads).toHaveLength(1)

    // AND: A single back returns to the index
    await page.goBack()
    await expect(page).toHaveURL(INDEX)
    await expect(documentation.locator('#section1')).toBeAttached()
  })

  test(`Going back between two fragments of a page ${arrival.name} loads no document`, async ({ page }) => {
    // GIVEN: A reader who jumped to two sections of the index, one after the other
    const documentation = await arrival.reachIndex(page)
    await settleOnIndex(page, documentation)
    await documentation.getByRole('link', { name: 'Jump to Section 1' }).click()
    await expect(page).toHaveURL(`${INDEX}#section1`)
    await documentation.getByRole('link', { name: 'Jump to Section 2' }).click()
    await expect(page).toHaveURL(`${INDEX}#section2`)
    const documentLoads = recordFrameDocumentLoads(page)
    await waitUntilQuiet(page, documentLoads)
    documentLoads.length = 0

    // WHEN: They go back
    await page.goBack()

    // THEN: They are at the first section again, without a document load in between
    await expect(page).toHaveURL(`${INDEX}#section1`)
    await expect(documentation.locator('#section1')).toBeInViewport()
    await waitUntilQuiet(page, documentLoads)
    expect(documentLoads).toHaveLength(0)
  })
}
