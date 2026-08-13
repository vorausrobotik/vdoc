import { expect } from '@playwright/test'
import type { SitePluginT } from '../../../src/ui/interfacesAndTypes/plugins/SitePlugin'
import testIDs from '../../../src/ui/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from '../base'

await prepareTestSuite(test)

const title = 'voraus robotik Software Documentation'
const description = 'Documentation for the voraus industrial automation platform.'
const longDescription = [
  '- **voraus.core** \u2014 the real-time runtime that drives an automation cell',
  '- **voraus.pioneer** \u2014 the development and simulation environment',
  '- **Components** \u2014 the libraries, integrations and examples around them',
]

const configured: SitePluginT = {
  name: 'site',
  active: true,
  title,
  description,
  long_description: longDescription,
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

  test('renders the long description as markdown', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) => route.fulfill({ json: configured }))
    await page.goto('/')

    const body = page.getByTestId(testIDs.plugins.site.longDescription)

    // A list, not three lines of literal markdown
    await expect(body.locator('li')).toHaveCount(3)
    await expect(body.locator('li').first()).toContainText('the real-time runtime that drives an automation cell')
    await expect(body.locator('strong').first()).toHaveText('voraus.core')
    await expect(body).not.toContainText('**')
  })

  test('links out safely and keeps internal links in the tab', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) =>
      route.fulfill({
        json: {
          ...configured,
          long_description: ['See [the manual](https://example.com/manual) and [projects](/example-project-01).'],
        },
      })
    )
    await page.goto('/')

    const body = page.getByTestId(testIDs.plugins.site.longDescription)
    const external = body.getByRole('link', { name: 'the manual' })
    const internal = body.getByRole('link', { name: 'projects' })

    await expect(external).toHaveAttribute('target', '_blank')
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(internal).not.toHaveAttribute('target', '_blank')
  })

  test('degrades disallowed markup to its text', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) =>
      route.fulfill({
        json: { ...configured, long_description: ['# Not a heading here', '', '<script>window.pwned = true</script>'] },
      })
    )
    await page.goto('/')

    const body = page.getByTestId(testIDs.plugins.site.longDescription)

    // The banner owns its type hierarchy, so a configured heading renders as text rather than as h1
    await expect(body).toContainText('Not a heading here')
    await expect(body.locator('h1, h2, h3')).toHaveCount(0)
    await expect(await page.evaluate(() => 'pwned' in window)).toBe(false)
  })

  test('renders only what is configured', async ({ page }) => {
    await page.route('*/**/api/plugins/site/', (route) =>
      route.fulfill({ json: { ...configured, description: null, long_description: null } })
    )
    await page.goto('/')

    await expect(page.getByTestId(testIDs.plugins.site.title)).toHaveText(title)
    await expect(page.getByTestId(testIDs.plugins.site.description)).not.toBeVisible()
    await expect(page.getByTestId(testIDs.plugins.site.longDescription)).not.toBeVisible()
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
