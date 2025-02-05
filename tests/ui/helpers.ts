import { Page, expect } from '@playwright/test'
import { ColorMode, EffectiveColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import { themes } from './base'

export const toggleAndTestColorMode = async (
  page: Page,
  currentMode: ColorMode,
  targetMode: ColorMode | null,
  systemMode: EffectiveColorMode | null | undefined
) => {
  const resultingCurrentMode = currentMode === 'system' ? (systemMode ? systemMode : 'dark') : currentMode

  // Check current theme
  await expect(page.getByTestId('headerBar')).toHaveCSS('background-color', themes[resultingCurrentMode].appBarColor)
  await expect(page.getByTestId('settingsSidebar')).not.toBeVisible()
  await expect(page.getByTestId('docIframe').contentFrame().locator('body')).toHaveCSS(
    'background-color',
    themes[resultingCurrentMode].backgroundColor
  )

  // Open settings and make sure that the current theme is selected
  await page.getByTestId('openAppSettings').click()
  await expect(page.getByTestId('settingsSidebar')).toBeVisible()
  const toggleButtonGroup = page.getByTestId('toggleColorModeGroup')
  const toggleButtons = toggleButtonGroup.locator('[data-testid^="toggleButton"]')
  await expect(toggleButtons).toHaveCount(3)
  const currentModeButton = toggleButtonGroup.locator('[aria-pressed="true"]')
  await expect(currentModeButton).toHaveCount(1)
  expect(await currentModeButton.getAttribute('value')).toBe(currentMode.toString())

  if (!targetMode) {
    return
  }
  const resultingTargetMode = targetMode === 'system' ? (systemMode ? systemMode : 'dark') : targetMode

  // Change the theme
  await page.getByTestId(`toggleButton-${targetMode}`).click()
  const newModeButton = toggleButtonGroup.locator('[aria-pressed="true"]')
  await expect(newModeButton).toHaveCount(1)
  expect(await newModeButton.getAttribute('value')).toBe(targetMode.toString())

  // Close settings
  await page.getByTestId('closeSettingsBtn').click()
  await expect(page.getByTestId('settingsSidebar')).not.toBeVisible()

  // Check new theme
  await expect(page.getByTestId('headerBar')).toHaveCSS('background-color', themes[resultingTargetMode].appBarColor)
  await expect(page.getByTestId('docIframe').contentFrame().locator('body')).toHaveCSS(
    'background-color',
    themes[resultingTargetMode].backgroundColor
  )
}
