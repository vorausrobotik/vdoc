import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { BASE_URL, openProjectDocumentation } from './helpers'

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
