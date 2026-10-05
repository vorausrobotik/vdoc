import { expect } from '@playwright/test'
import testIDs from '@/interfacesAndTypes/testIDs'
import test, { mockedProjects, prepareTestSuite } from './base'
import { assertIndexPage, assertVersionDropdown, assertVersionOverview } from './helpers'

await prepareTestSuite(test)

test('Test navigation index to documentation to version overview', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState()

  await assertIndexPage(page, {
    categories: {
      General: [{ name: 'example-project-01', title: 'Example Project 01', description: 'The first example' }],
      Extensions: [{ name: 'example-project-02', title: 'example-project-02' }],
      Misc: [{ name: 'example-project-03', title: 'example-project-03' }],
    },
  })

  const projectCards = page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
  const versionDropdown = page.getByTestId(testIDs.header.versionDropdown.main)
  const docIframe = page.getByTestId(testIDs.project.documentation.documentationIframe)
  const expectedDocumentationContent = 'Hello, this is a mocked documentation component.'
  const latestVersionWarningBanner = page.getByTestId(testIDs.project.documentation.latestVersionWarningBanner)

  await expect(versionDropdown).not.toBeVisible()
  await expect(docIframe).not.toBeVisible()
  const documentationButton = projectCards.nth(0)
  await expect(documentationButton).toBeVisible()
  await expect(latestVersionWarningBanner).not.toBeVisible()

  // Navigate to the latest documentation of example-project-01
  await documentationButton.click()
  await page.waitForLoadState()
  await expect(page).toHaveURL(/.*example-project-01\/3.2.0/)

  // Ensure documentation is rendered in the iframe
  await expect(docIframe.contentFrame().locator('html')).toContainText(expectedDocumentationContent)

  // Test the version dropdown. The latest version is 3.2.0. There must be 5 options including a link to more
  const dropdownItems = await assertVersionDropdown(page, '3.2.0', ['3.2.0', '3.1.0', '3.0.0', '2.0.0', '1.0.0'])

  // Navigate to the version overview
  await dropdownItems.showAllItem.click()
  await assertVersionOverview(page, 'example-project-01', '3.2.0', {
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
  await page.waitForLoadState()
  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe('No projects found')
  expect(await page.getByTestId(testIDs.errorComponent.description).innerText()).toBe(
    'Upload docs to vdoc to get started!'
  )
  expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe('RELOAD PROJECTS')

  // Mock the API request to return a list of projects and reload the page
  await page.route('*/**/api/projects/', (route) =>
    route.fulfill({
      json: [
        { ...mockedProjects[0], name: 'test-01', display_name: 'Test 01', category_id: null },
        { ...mockedProjects[0], name: 'test-02', display_name: 'Test 02', category_id: null },
      ],
    })
  )
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // Expect the error component to be gone and a list of project cars to be present
  await expect(page.getByTestId(testIDs.errorComponent.main)).not.toBeVisible()
  const projectCards = page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
  await expect(projectCards).toHaveCount(2)
})
