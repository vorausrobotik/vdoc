import { expect } from '@playwright/test'
import type { SitePluginT } from '../../../src/ui/interfacesAndTypes/plugins/SitePlugin'
import testIDs from '../../../src/ui/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from '../base'

await prepareTestSuite(test)

const title = 'voraus robotik Software Documentation'
const description = 'Documentation for the voraus automation platform and the components around it.'

const configured: SitePluginT = {
  name: 'site',
  active: true,
  title,
  description,
  show_on_landing_page: true,
}

test.describe('Site plugin', () => {
  test('introduces the instance above the projects', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) => route.fulfill({ json: configured }))
    await page.goto('/')

    await expect(page.getByTestId(testIDs.plugins.site.title)).toHaveText(title)
    await expect(page.getByTestId(testIDs.plugins.site.description)).toHaveText(description)

    // The introduction has to precede the projects, not replace them
    await expect(page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.main).first()).toBeVisible()
  })

  test('renders only what is configured', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) => route.fulfill({ json: { ...configured, description: null } }))
    await page.goto('/')

    await expect(page.getByTestId(testIDs.plugins.site.title)).toHaveText(title)
    await expect(page.getByTestId(testIDs.plugins.site.description)).not.toBeVisible()
  })

  test('stays hidden while it is switched off for the landing page', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) =>
      route.fulfill({ json: { ...configured, show_on_landing_page: false } })
    )
    await page.goto('/')

    await expect(page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.main).first()).toBeVisible()
    await expect(page.getByTestId(testIDs.plugins.site.main)).not.toBeVisible()
  })

  test('stays hidden while the instance says nothing about itself', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.main).first()).toBeVisible()
    await expect(page.getByTestId(testIDs.plugins.site.main)).not.toBeVisible()
  })
})
