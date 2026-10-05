import { expect, type Page } from '@playwright/test'
import type { EffectiveColorMode } from '@/interfacesAndTypes/ColorModes'
import type { SitePluginT } from '@/interfacesAndTypes/plugins/SitePlugin'
import testIDs from '@/interfacesAndTypes/testIDs'
import test, { mockedProjects, prepareTestSuite } from './base'
import { switchColorMode } from './helpers'

await prepareTestSuite(test)

const cardIDs = testIDs.landingPage.projectCategories.projectCategory.projects.projectCard

const useTheme = async (page: Page, theme: 'voraus' | 'default', site: Partial<SitePluginT> = {}) => {
  await page.route('*/**/api/plugins/site/', (route) =>
    route.fulfill({
      json: {
        name: 'site',
        active: false,
        title: null,
        description: null,
        long_description: null,
        show_on_landing_page: true,
        theme,
        ...site,
      },
    })
  )
}

/** Marks the first of the mocked projects as featured, the way the admin's star stores it. */
const featureFirstProject = async (page: Page, featured_label: string | null = null) => {
  const [first, ...rest] = mockedProjects
  await page.route('*/**/api/projects/', (route) =>
    route.fulfill({ json: [{ ...first, featured: true, featured_label }, ...rest] })
  )
}

/** What a token resolves to on the page, as the browser paints it, once the theme has rendered. */
const resolvedToken = async (page: Page, token: string) => {
  // The interface renders only after the theme's stylesheets have loaded
  await expect(page.getByTestId(testIDs.header.main)).toBeVisible()
  return page.evaluate((name) => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = `var(${name})`
    document.body.append(probe)
    const color = getComputedStyle(probe).backgroundColor
    probe.remove()
    return color
  }, token)
}

test.describe('Default theme', () => {
  test('carries no brand', async ({ page }) => {
    await useTheme(page, 'default')
    await page.goto('/')

    await expect(page.getByTestId(testIDs.header.logo.text)).toHaveText('vdoc')
    await expect(page.getByTestId(testIDs.header.logo.main).locator('svg')).toBeVisible()
    // Small enough for the build to inline, so the icon arrives as the drawing itself rather than a file
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /vdoc\.svg$|^data:image\/svg\+xml/)
    // The voraus stylesheets are not loaded at all, so none of their tokens exist
    const surface = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--voraus-color-surface-page')
    )
    expect(surface).toBe('')
  })
})

test.describe('voraus theme', () => {
  for (const mode of ['light', 'dark'] as const satisfies EffectiveColorMode[]) {
    test(`paints the ${mode} tokens when the system prefers ${mode}`, async ({ page }) => {
      await useTheme(page, 'voraus')
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/')

      await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
      await expect(page.locator('body')).toHaveCSS(
        'background-color',
        await resolvedToken(page, '--voraus-color-surface-page')
      )
      // The design system's bar, with its own mark linking home
      await expect(page.getByTestId(testIDs.header.main)).toHaveClass(/voraus-header/)
      await expect(page.getByTestId(testIDs.header.main).locator('a[href="/"] svg:visible')).toHaveCount(1)
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /voraus.*\.ico$/)
    })
  }

  test('keeps the height of the header when a documentation adds its version picker', async ({ page }) => {
    await useTheme(page, 'voraus')
    await page.goto('/')
    const header = page.getByTestId(testIDs.header.main)
    await expect(header).toBeVisible()
    const landing = (await header.boundingBox())?.height

    await page.goto('/example-project-01/latest')
    await expect(page.getByTestId(testIDs.header.versionDropdown.main)).toBeVisible()

    expect((await header.boundingBox())?.height).toBe(landing)
  })

  test('follows the color mode toggle', async ({ page }) => {
    await useTheme(page, 'voraus')
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    const lightSurface = await resolvedToken(page, '--voraus-color-surface-page')

    await switchColorMode(page, 'dark')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const darkSurface = await resolvedToken(page, '--voraus-color-surface-page')
    expect(darkSurface).not.toBe(lightSurface)
    await expect(page.locator('body')).toHaveCSS('background-color', darkSurface)
  })

  test('keeps the dark tokens on a load with the stylesheets cached', async ({ page }) => {
    // The dark tokens win over the light ones only by being loaded later, so a load from a warm cache
    // has to keep the order the brand imports them in
    await useTheme(page, 'voraus')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.goto('/example-project-01/latest')

    // In the wrong order the light value, which is white, wins although the page is dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await resolvedToken(page, '--voraus-color-surface-page')).not.toBe('rgb(255, 255, 255)')
  })

  test('opens the landing page with the hero', async ({ page }) => {
    await useTheme(page, 'voraus', { active: true, title: 'Software documentation' })
    await page.goto('/')

    await expect(page.getByTestId(testIDs.plugins.site.main).getByRole('heading', { level: 1 })).toHaveText(
      'Software documentation'
    )
  })

  test('offers to start with the featured project', async ({ page }) => {
    await useTheme(page, 'voraus', { active: true, title: 'Software documentation' })
    await featureFirstProject(page)
    await page.goto('/')

    const start = page.getByTestId(testIDs.plugins.site.featuredProject)
    await expect(start).toHaveText('Start with Example Project 01')
    await expect(start).toHaveAttribute('href', '/example-project-01/latest')
    await expect(page.getByRole('button', { name: 'All projects' })).toBeVisible()
  })

  test('labels the start button as the admin wrote it', async ({ page }) => {
    await useTheme(page, 'voraus', { active: true, title: 'Software documentation' })
    await featureFirstProject(page, 'Start with the first example')
    await page.goto('/')

    await expect(page.getByTestId(testIDs.plugins.site.featuredProject)).toHaveText('Start with the first example')
  })

  test('offers no start without a featured project', async ({ page }) => {
    await useTheme(page, 'voraus', { active: true, title: 'Software documentation' })
    await page.goto('/')

    await expect(page.getByTestId(testIDs.plugins.site.main)).toBeVisible()
    await expect(page.getByTestId(testIDs.plugins.site.featuredProject)).toHaveCount(0)
  })

  test('shows the newest version and the version count on a card', async ({ page }) => {
    await useTheme(page, 'voraus')
    await page.goto('/')

    const card = page.getByTestId(cardIDs.main).first()
    await expect(card).toContainText('3.2.0')
    await expect(card.getByTestId(cardIDs.actions.main)).toContainText('7 versions published')
  })

  test('draws each project as a tile that opens its newest version', async ({ page }) => {
    await useTheme(page, 'voraus')
    await page.goto('/')

    const card = page.getByTestId(cardIDs.main).first()
    await expect(card).toHaveClass(/MuiPaper-tile/)
    await expect(card).toHaveAttribute('href', '/example-project-01/latest')
  })

  test('draws square, outlined cards', async ({ page }) => {
    await useTheme(page, 'voraus')
    await page.goto('/')

    const card = page.getByTestId(cardIDs.main).first()
    await expect(card).toHaveCSS('border-radius', '0px')
    await expect(card).toHaveCSS('box-shadow', 'none')
    await expect(card).toHaveCSS('border-top-width', '1px')
  })
})
