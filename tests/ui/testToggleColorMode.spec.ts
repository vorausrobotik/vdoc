import { expect } from '@playwright/test'
import test, { themes } from './base'
import { toggleAndTestColorMode } from './helpers'

test.describe('Color schemes tests', () => {
  test('Theme should be set to light if preferred color scheme is undefined', async ({ page }) => {
    await page.emulateMedia({ colorScheme: undefined })
    await page.goto('/example-project-01/latest')
    await expect(page.getByTestId('headerBar')).toHaveCSS('background-color', themes.light.appBarColor)
    await expect(page.getByTestId('docIframe').contentFrame().locator('body')).toHaveCSS(
      'background-color',
      themes.light.backgroundColor
    )
  })

  test('Toggle color mode from system (dark) to light should work', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/example-project-01/latest')
    await expect(page.getByTestId('loadingIndicator')).not.toBeVisible()
    await toggleAndTestColorMode(page, 'system', 'light', 'dark')
  })

  test('Toggle color mode from system (light) to dark should work', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/example-project-01/latest')
    await expect(page.getByTestId('loadingIndicator')).not.toBeVisible()
    await toggleAndTestColorMode(page, 'system', 'dark', 'light')
  })
})
