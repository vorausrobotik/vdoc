import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import type { ColorMode, EffectiveColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { themes } from './base'

/**
 * Expects that the index/home page is visible including all project cards.
 *
 * @param page The playwright page object.
 * @param options The optional playwright options.
 */
export const assertIndexPage = async (page: Page, options?: { timeout?: number }) => {
  await expect(page).toHaveURL('http://localhost:3000', { timeout: options?.timeout })
  await expect(page.getByTestId(testIDs.landingPage.projectCard.main)).toHaveCount(3)
}

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
 *
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
 * Switches the color mode to ``mode``.
 *
 * @param page The playwright page object.
 * @param mode he color mode that should be applied.
 */
export const switchColorMode = async (page: Page, mode: ColorMode) => {
  await openSettingsSidebar(page)
  await page.getByTestId(testIDs.sidebar.settings.toggleColorModes.buttons[mode]).click()
  await assertCurrentColorModeButton(page, mode)
}

/**
 * Opens a documentation and waits for the iframe to be fully loaded.
 *
 * @param page The playwright page object.
 * @param name The project name.
 * @param version The project version.
 * @returns The iframe locator.
 */
export const openProjectDocumentation = async (page: Page, name: string, version: string): Promise<Locator> => {
  const docIframe = page.getByTestId(testIDs.project.documentation.documentationIframe)

  await page.goto(`/${name}/${version}`)

  await expect(docIframe).toBeVisible({ timeout: 10000 })

  await docIframe.waitFor({ state: 'attached' })
  const iframeDocument = docIframe.contentFrame()
  expect(iframeDocument).not.toBeNull()

  await expect(iframeDocument.locator('html')).toBeVisible({ timeout: 10000 })

  return iframeDocument.locator('html')
}
