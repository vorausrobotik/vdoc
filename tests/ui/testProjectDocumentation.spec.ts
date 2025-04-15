import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { assertIndexPage, assertErrorComponent, BASE_URL } from './helpers'

await prepareTestSuite(test)

test('Requesting non existing versions must be handled properly with automatic redirect', async ({ page }) => {
  await page.goto('/')
  await assertIndexPage(page)
  await page.goto('/example-project-01/42.0.0')
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/42.0.0`)

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()
  await expect(page.getByTestId(testIDs.header.versionDropdown.main)).toHaveText('Select version...')

  await assertErrorComponent(page, {
    title: "Project 'example-project-01' doesn't have a documentation for version '42.0.0'",
    actionButtonText: 'GO BACK',
  })

  for (const remainingSeconds of [5, 4, 3, 2, 1]) {
    await expect(page.getByTestId(testIDs.errorComponent.description)).toHaveText(
      `Returning to previous page in ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}...`
    )
  }

  // User must be redirected to previous page
  await assertIndexPage(page)
})

test('Requesting non existing versions must be handled properly with manual redirect', async ({ page }) => {
  await page.goto('/')
  await assertIndexPage(page)
  await page.goto('/example-project-01/42.0.0')
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/42.0.0`)

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await assertErrorComponent(page, {
    title: "Project 'example-project-01' doesn't have a documentation for version '42.0.0'",
    actionButtonText: 'GO BACK',
  })

  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await assertIndexPage(page, { timeout: 1000 })
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
  await assertIndexPage(page)
  await page.goto('/example-project-01/invalid')
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/invalid`)

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await assertErrorComponent(page, {
    title: "'invalid' is not a valid version identifier.",
    actionButtonText: 'GO BACK',
  })

  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await assertIndexPage(page, { timeout: 1000 })
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
  await assertIndexPage(page)
  await page.goto('/non-existing-project')
  await expect(page).toHaveURL(`${BASE_URL}/non-existing-project`)

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await assertErrorComponent(page, {
    title: "Project 'non-existing-project' doesn't exist.",
    actionButtonText: 'GO BACK',
  })

  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await assertIndexPage(page, { timeout: 1000 })
})

test('Requesting non existing version must be handled properly', async ({ page }) => {
  const errorMessage = "Project 'example-project-01' doesn't have a documentation for version '1'."
  await page.route('*/**/api/projects/example-project-01/versions/1', (route) =>
    route.fulfill({
      status: 404,
      body: JSON.stringify({
        message: errorMessage,
      }),
    })
  )
  await page.goto('/')
  await assertIndexPage(page)
  await page.goto('/example-project-01/1')
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/1`)

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await assertErrorComponent(page, {
    title: errorMessage,
    actionButtonText: 'GO BACK',
  })
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await assertIndexPage(page, { timeout: 1000 })
})

test('Requesting non existing documentation page must be handled properly', async ({ page }) => {
  await page.goto('/')
  await assertIndexPage(page)
  await page.goto('/example-project-03/1.0.0/nonexisting.html')
  await expect(page).toHaveURL(`${BASE_URL}/example-project-03/1.0.0/nonexisting.html`)

  await expect(page.getByTestId(testIDs.project.documentation.documentationIframe)).not.toBeVisible()

  await assertErrorComponent(page, {
    title: "Whoops! This page doesn't seem to exist...",
    actionButtonText: 'GO BACK',
  })
  await page.getByTestId(testIDs.errorComponent.actionButton).click()

  // User must be redirected to previous page
  await assertIndexPage(page, { timeout: 1000 })
})
