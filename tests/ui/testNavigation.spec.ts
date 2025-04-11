import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { BASE_URL, assertIndexPage, assertMenuBar, openProjectDocumentation, assertVersionOverview } from './helpers'

await prepareTestSuite(test)

test('Test navigation back to index page from index page (stay on same page)', async ({ page }) => {
  // GIVEN: The user is on the index page
  await page.goto('/')
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)

  // WHEN: The user clicks on the logo
  await page.getByTestId(testIDs.header.logo.main).click()

  // THEN: The user should stay on the index page
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)
})

test('Test navigation back to index page from project documentation', async ({ page }) => {
  // GIVEN: The user navigates to the documentation of a project
  await openProjectDocumentation(page, 'example-project-01', 'latest')
  await assertMenuBar(page, `${BASE_URL}/`)

  // WHEN: The user clicks on the logo
  await page.getByTestId(testIDs.header.logo.main).click()

  // THEN: The user should be redirected to the index page
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)
})

test('Test navigation back to index page from project version overview', async ({ page }) => {
  // GIVEN: The user navigates to the version overview of a project
  await page.goto('/example-project-01')
  await assertVersionOverview(page, 'example-project-01', {
    v3: ['3.0.0', '3.1.0', '3.2.0'],
    v2: ['2.0.0'],
    v1: ['1.0.0'],
    v0: ['0.1.0', '0.2.0'],
  })

  // WHEN: The user clicks on the logo
  await page.getByTestId(testIDs.header.logo.main).click()

  // THEN: The user should be redirected to the index page
  await assertIndexPage(page)
  await assertMenuBar(page, `${BASE_URL}/`)
})
