import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { assertIndexPage, assertVersionOverview, assertVersionDropdown } from './helpers'

await prepareTestSuite(test)

test('Test navigation index to documentation to version overview', async ({ page }) => {
  await page.goto('/')

  await assertIndexPage(page, {
    categories: {
      General: [{ name: 'example-project-01', display_name: 'Example Project 01', category_id: 0 }],
      Extensions: [{ name: 'example-project-02', display_name: 'example-project-02', category_id: 1 }],
      Misc: [{ name: 'example-project-03', display_name: 'example-project-03', category_id: null }],
    },
  })

  const projectCards = page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
  const versionDropdown = page.getByTestId(testIDs.header.versionDropdown.main)
  const docIframe = page.getByTestId(testIDs.project.documentation.documentationIframe)
  const expectedDocumentationContent = 'Hello, this is a mocked documentation component.'
  const latestVersionWarningBanner = page.getByTestId(testIDs.project.documentation.latestVersionWarningBanner)

  await expect(versionDropdown).not.toBeVisible()
  await expect(docIframe).not.toBeVisible()
  const documentationButton = projectCards
    .nth(0)
    .getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.actions.documentationLink)
  await expect(documentationButton).toBeVisible()
  await expect(latestVersionWarningBanner).not.toBeVisible()

  // Navigate to the latest documentation of example-project-01
  await documentationButton.click()
  await expect(page).toHaveURL(/.*example-project-01\/latest/)

  // Ensure documentation is rendered in the iframe
  await expect(docIframe.contentFrame().locator('html')).toContainText(expectedDocumentationContent)

  // Test the version dropdown. The latest version is 3.2.0. There must be 5 options including a link to more
  const dropdownItems = await assertVersionDropdown(page, '3.2.0', ['3.2.0', '3.1.0', '3.0.0', '2.0.0', '1.0.0'])

  // Navigate to the version overview
  await dropdownItems.showAllItem.click()
  await assertVersionOverview(page, 'example-project-01', {
    v3: ['3.0.0', '3.1.0', '3.2.0'],
    v2: ['2.0.0'],
    v1: ['1.0.0'],
    v0: ['0.1.0', '0.2.0'],
  })

  // Navigate to version 1.0.0 of the documentation
  await page.getByRole('button', { name: '1.0.0' }).click()

  // Make sure that all variables have updated correctly
  await expect(page).toHaveURL(/.*example-project-01\/1.0.0/)
  await expect(latestVersionWarningBanner).toBeVisible()
  await expect(docIframe.contentFrame().locator('html')).toContainText(expectedDocumentationContent)
  await expect(versionDropdown).toContainText('1.0.0')
})

test('Test project overview on no projects', async ({ page }) => {
  // Reset global mocks
  await page.unrouteAll()
  await page.route('*/**/api/projects/', (route) =>
    route.fulfill({
      json: [],
    })
  )

  // Make sure no projects are listed and the error component is shown with all correct parameters
  await page.goto('/')
  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe('No projects found')
  expect(await page.getByTestId(testIDs.errorComponent.description).innerText()).toBe(
    'Upload docs to vdoc to get started!'
  )
  expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe('RELOAD PROJECTS')

  // Mock the API request to return a list of projects and reload the page
  await page.route('*/**/api/projects/', (route) =>
    route.fulfill({
      json: ['test-01', 'test-02'],
    })
  )
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // Expect the error component to be gone and a list of project cars to be present
  await expect(page.getByTestId(testIDs.errorComponent.main)).not.toBeVisible()
  const projectCards = page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
  await expect(projectCards).toHaveCount(2)
})
