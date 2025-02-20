import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import type { ColorMode, EffectiveColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { themes } from './base'

/**
 * Expects the given hyperlinks to be visible on the page in the given order.
 *
 * @param locator The playwright locator that must include the expected links.
 * @param links The expected links to be visible on the page.
 *
 * @returns The link locators.
 */
export const assertLinksOnPage = async (locator: Locator, links: string[]): Promise<Locator> => {
  const availableLinks = locator.getByRole('link')
  await expect(availableLinks).toHaveCount(links.length)
  const actualLinks = await availableLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(actualLinks).toStrictEqual(links)
  return availableLinks
}

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
 * Expects the error component to be visible and show the given details.
 * @param page The playwright page object.
 * @param options The error component properties to check for.
 */
export const assertErrorComponent = async (
  page: Page,
  options: { title: string; description?: string; actionButtonText?: string }
) => {
  await expect(page.getByTestId(testIDs.errorComponent.main)).toBeVisible()
  expect(await page.getByTestId(testIDs.errorComponent.title).innerText()).toBe(options.title)
  if (options.description) {
    expect(await page.getByTestId(testIDs.errorComponent.description).innerText()).toBe(options.description)
  }
  if (options.actionButtonText) {
    expect(await page.getByTestId(testIDs.errorComponent.actionButton).innerText()).toBe(options.actionButtonText)
  }
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

  await expect(page).toHaveURL(`http://localhost:3000/${name}/${version}`)

  await expect(docIframe).toBeVisible({ timeout: 10000 })

  await docIframe.waitFor({ state: 'attached' })
  const iframeDocument = docIframe.contentFrame()
  expect(iframeDocument).not.toBeNull()

  await expect(iframeDocument.locator('html')).toBeVisible({ timeout: 10000 })

  return iframeDocument.locator('html')
}
