import { expect } from '@playwright/test'
import testIDs from '../../../src/ui/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from '../base'

await prepareTestSuite(test)

const configured = {
  name: 'theme',
  active: true,
  border_radius: 0,
  flat_cards: true,
  light: { palette: { primary: '#E133FF', divider: '#E7E7EA' } },
  dark: { palette: { primary: '#00CFC6', divider: '#2A2A30', background_default: '#0C0C0E' } },
}

test.describe('Theme plugin palette', () => {
  test('colors the actionable elements per color mode', async ({ page }) => {
    await page.route('*/**/api/plugins/theme/', (route) => route.fulfill({ json: configured }))

    for (const [mode, expected] of [
      ['light', 'rgb(225, 51, 255)'],
      ['dark', 'rgb(0, 207, 198)'],
    ] as const) {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/')
      const link = page
        .getByTestId(
          testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.actions.documentationLink
        )
        .first()
      await expect(link).toHaveCSS('color', expected)
    }
  })

  test('squares the corners and outlines the cards', async ({ page }) => {
    await page.route('*/**/api/plugins/theme/', (route) => route.fulfill({ json: configured }))
    await page.goto('/')

    const card = page
      .getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
      .first()
    await expect(card).toHaveCSS('border-radius', '0px')
    await expect(card).toHaveCSS('box-shadow', 'none')
    await expect(card).toHaveCSS('border-top-width', '1px')
  })

  test('leaves the framework defaults alone when nothing is configured', async ({ page }) => {
    await page.goto('/')

    const card = page
      .getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
      .first()
    // MUI's own default radius, which an unconfigured instance has to keep
    await expect(card).toHaveCSS('border-radius', '4px')
  })
})
