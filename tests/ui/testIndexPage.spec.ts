import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'

await prepareTestSuite(test)

test('Test navigation index to documentation to version overview', async ({ page }) => {
  await page.goto('/')

  const projectCards = page.getByTestId(testIDs.landingPage.projectCard.main)
  const versionDropdown = page.getByTestId(testIDs.header.versionDropdown.main)
  const docIframe = page.getByTestId(testIDs.project.documentation.documentationIframe)
  const expectedDocumentationContent = 'Hello, this is a mocked documentation component.'
  const latestVersionWarningBanner = page.getByTestId(testIDs.project.documentation.latestVersionWarningBanner)

  // Expect three projects on the main page with links to the docs
  await expect(projectCards).toHaveCount(3)
  await expect(versionDropdown).not.toBeVisible()
  await expect(docIframe).not.toBeVisible()
  const documentationButton = projectCards.nth(0).getByTestId(testIDs.landingPage.projectCard.actions.documentationLink)
  await expect(documentationButton).toBeVisible()
  await expect(latestVersionWarningBanner).not.toBeVisible()
  await expect(documentationButton).toHaveText('Documentation')

  // Navigate to the latest documentation of example-project-01
  await documentationButton.click()
  await expect(page).toHaveURL(/.*example-project-01\/latest/)

  // Ensure documentation is rendered in the iframe
  await expect(docIframe.contentFrame().locator('html')).toContainText(expectedDocumentationContent)

  // Test the version dropdown. The latest version is 3.2.0. There must be 5 options including a link to more
  await expect(versionDropdown).toBeVisible()
  await expect(versionDropdown).toContainText('3.2.0')
  await versionDropdown.click()
  const versionOptions = page.getByRole('option')
  await expect(versionOptions).toHaveCount(6)
  const expectedOptions = ['3.2.0', '3.1.0', '3.0.0', '2.0.0', '1.0.0', '...more']
  for (const [index, value] of expectedOptions.entries()) {
    await expect(versionOptions.nth(index)).toContainText(value)
  }

  // Navigate to the version overview
  await versionOptions.last().click()
  await expect(page).toHaveURL(/.*example-project-01/)

  await expect(page.getByTestId(testIDs.project.versionOverview.majorVersionCard.main)).toHaveCount(4)

  // Navigate to version 1.0.0 of the documentation
  await page.getByRole('button', { name: '1.0.0' }).click()

  // Make sure that all variables have updated correctly
  await expect(page).toHaveURL(/.*example-project-01\/1.0.0/)
  await expect(latestVersionWarningBanner).toBeVisible()
  await expect(docIframe.contentFrame().locator('html')).toContainText(expectedDocumentationContent)
  await expect(versionDropdown).toContainText('1.0.0')
})
