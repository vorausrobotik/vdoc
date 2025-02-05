import { Page, expect } from '@playwright/test'
import { ColorMode, EffectiveColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { themes } from './base'

/**
 * Closes the settings sidebar if it is open and compare the color schemes of the main app and the embedded iframe.
 *
 * @param page The playwright page object.
 * @param mode The color/palette mode that should be applied.
 */
export const assertTheme = async (page: Page, mode: EffectiveColorMode) => {
  await closeSettingsSidebar(page)
  await expect(page.getByTestId(testIDs.header.main)).toHaveCSS('background-color', themes[mode].appBarColor)
  await expect(
    page.getByTestId(testIDs.project.documentation.documentationIframe).contentFrame().locator('body')
  ).toHaveCSS('background-color', themes[mode].backgroundColor)
}

/**
 * Opens the settings sidebar if it is not open, yet.
 *
 * @param page The playwright page object.
 */
export const openSettingsSidebar = async (page: Page) => {
  const sideBarElement = page.getByTestId(testIDs.sidebar.main)
  if (!(await sideBarElement.isVisible())) {
    await page.getByTestId(testIDs.header.settingsButton).click()
  }

  await expect(sideBarElement).toBeVisible()
}

/**
 * Closes the settings sidebar if it is open.
 *
 * @param page The playwright page object.
 */
export const closeSettingsSidebar = async (page: Page) => {
  const sideBarElement = page.getByTestId(testIDs.sidebar.main)
  if (await sideBarElement.isVisible()) {
    await page.getByTestId(testIDs.sidebar.close).click()
  }
  await expect(sideBarElement).not.toBeVisible()
}

/**
 * Ensures that the currently selected color mode in the settings sidebar is ``mode``.
 * @param page The playwright page object.
 * @param mode The color mode button that should be selected.
 */
export const assertCurrentColorModeButton = async (page: Page, mode: ColorMode) => {
  await openSettingsSidebar(page)

  const toggleButtonGroup = page.getByTestId(testIDs.sidebar.settings.toggleColorModes.main)
  const toggleButtons = toggleButtonGroup.getByRole('button')
  await expect(toggleButtons).toHaveCount(3)
  expect(await toggleButtons.allTextContents()).toStrictEqual(['Light', 'System', 'Dark'])

  // Make sure that there is only one option selected
  const currentModeButton = toggleButtonGroup.locator('[aria-pressed="true"]')
  await expect(currentModeButton).toHaveCount(1)

  // Expect that the selected button is ``mode``
  expect((await currentModeButton.innerText()).toLowerCase()).toBe(mode.toString())
}

/**
 * Switches the color mode th ``mode``.
 * @param page The playwright page object.
 * @param mode he color mode that should be applied.
 */
export const switchColorMode = async (page: Page, mode: ColorMode) => {
  await openSettingsSidebar(page)
  await page.getByTestId(testIDs.sidebar.settings.toggleColorModes.buttons[mode]).click()
  await assertCurrentColorModeButton(page, mode)
}
