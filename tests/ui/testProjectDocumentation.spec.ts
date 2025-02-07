import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'

await prepareTestSuite(test)

test('Requesting non existing versions must be handled properly with automatic redirect', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('http://localhost:3000')
  await page.goto('/example-project-01/42.0.0')
  await expect(page).toHaveURL('http://localhost:3000/example-project-01/42.0.0')

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe(
    "Project 'example-project-01' doesn't have a documentation for version '42.0.0'"
  )
  expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe('GO BACK')
  for (const remainingSeconds of [5, 4, 3, 2, 1]) {
    await expect(page.getByTestId(testIDs.errorComponent.description)).toHaveText(
      `Returning to previous page in ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}...`
    )
  }

  // User must be redirected to previous page
  await expect(page).toHaveURL('http://localhost:3000')
})

test('Requesting non existing versions must be handled properly with manual redirect', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('http://localhost:3000')
  await page.goto('/example-project-01/42.0.0')
  await expect(page).toHaveURL('http://localhost:3000/example-project-01/42.0.0')

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe(
    "Project 'example-project-01' doesn't have a documentation for version '42.0.0'"
  )
  expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe('GO BACK')
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await expect(page).toHaveURL('http://localhost:3000', { timeout: 2000 })
})

test('Requesting invalid versions must be handled properly with manual redirect', async ({ page }) => {
  await page.route('*/**/api/projects/example-project-01/versions/invalid', (route) =>
    route.fulfill({
      status: 401,
      body: JSON.stringify({
        message: "'invalid' is not a valid version identifier.",
      }),
    })
  )
  await page.goto('/')
  await expect(page).toHaveURL('http://localhost:3000')
  await page.goto('/example-project-01/invalid')
  await expect(page).toHaveURL('http://localhost:3000/example-project-01/invalid')

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe(
    "'invalid' is not a valid version identifier."
  )
  expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe('GO BACK')
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await expect(page).toHaveURL('http://localhost:3000', { timeout: 2000 })
})

test('Requesting non existing project must be handled properly', async ({ page }) => {
  await page.route('*/**/api/projects/non-existing-project/versions/', (route) =>
    route.fulfill({
      status: 404,
      body: JSON.stringify({
        message: "Project 'non-existing-project' doesn't exist.",
      }),
    })
  )
  await page.goto('/')
  await expect(page).toHaveURL('http://localhost:3000')
  await page.goto('/non-existing-project')
  await expect(page).toHaveURL('http://localhost:3000/non-existing-project')

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe(
    "Project 'non-existing-project' doesn't exist."
  )
  expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe('GO BACK')
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await expect(page).toHaveURL('http://localhost:3000', { timeout: 2000 })
})
