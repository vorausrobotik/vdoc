import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { BASE_URL, assertIndexPage, assertMenuBar, openProjectDocumentation, assertVersionOverview } from './helpers'

await prepareTestSuite(test)

test('Test navigation back to index page from index page (stay on same page)', async ({ page }) => {
  // GIVEN: The user is on the index page
  await page.goto('/')
  await page.waitForLoadState()
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)

  // WHEN: The user clicks on the logo
  await page.getByTestId(testIDs.header.logo.main).click()

  // THEN: The user should stay on the index page
  await assertIndexPage(page)
  await page.waitForLoadState()
  await assertMenuBar(page, `${BASE_URL}/`)
})

test('Test navigation back to index page from project documentation', async ({ page }) => {
  // GIVEN: The user navigates to the documentation of a project
  await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  await assertMenuBar(page, `${BASE_URL}/`)

  // WHEN: The user clicks on the logo
  await page.getByTestId(testIDs.header.logo.main).click()

  // THEN: The user should be redirected to the index page
  await page.waitForLoadState()
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)
})

test('Test navigation back to index page from project version overview', async ({ page }) => {
  // GIVEN: The user navigates to the version overview of a project
  await page.goto('/example-project-01')
  await page.waitForLoadState()
  await assertVersionOverview(page, 'example-project-01', '3.2.0', {
    v3: ['3.0.0', '3.1.0', '3.2.0'],
    v2: ['2.0.0'],
    v1: ['1.0.0'],
    v0: ['0.1.0', '0.2.0'],
  })

  // WHEN: The user clicks on the logo
  await page.getByTestId(testIDs.header.logo.main).click()

  // THEN: The user should be redirected to the index page
  await page.waitForLoadState()
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)
})

test('Test forward and backward browser navigation', async ({ page }) => {
  // GIVEN: The user opens a documentation
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')
  const baseUrl = `${BASE_URL}/example-project-01/3.2.0`

  // THEN: The documentation main (index) page must be shown
  await expect(page).toHaveURL(baseUrl)
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  // WHEN: The user navigates to a sub (example) page of the documentation
  await documentation.getByRole('link', { name: /examples\.html/i }).click()
  await page.waitForLoadState()

  // THEN: The sub page must be shown
  await expect(page).toHaveURL(`${baseUrl}/examples.html`)
  await expect(documentation).toContainText('This is a mocked examples page')

  // WHEN: The user uses the "navigate back" browser button / feature
  await page.goBack()
  await page.waitForLoadState()

  // THEN: The documentation main (index) page must be shown again
  await expect(page).toHaveURL(baseUrl)
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  // WHEN: The user uses the "navigate forward" browser button / feature
  await page.goForward()
  await page.waitForLoadState()

  // THEN: The sub page must be shown again
  await expect(page).toHaveURL(`${baseUrl}/examples.html`)
  await expect(documentation).toContainText('This is a mocked examples page')
})
