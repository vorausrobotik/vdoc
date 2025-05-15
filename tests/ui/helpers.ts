import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import type { ColorMode, EffectiveColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import type { Project } from '../../src/ui/interfacesAndTypes/Project'
import { themes } from './base'

export const BASE_URL = 'http://localhost:3000'

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
 * Asserts that clicking a link opens a new tab (popup page).
 *
 * @param page The playwright page object.
 * @param linkLocator The link locator to click.
 * @param expectedUrl The expected URL in the new tab.
 * @param options Optional settings for validation.
 * @param options.timeout Optional timeout for popup detection.
 *
 * @returns The new tab.
 */
export async function assertLinkOpensInNewTab(
  page: Page,
  linkSelector: Locator,
  expectedUrl: string,
  options?: {
    timeout?: number
  }
): Promise<Page> {
  const { timeout } = options ?? {}

  const originalUrl = page.url()

  // Wait for a new page (popup) to open after clicking the link
  const [newPage] = await Promise.all([page.waitForEvent('popup', { timeout }), linkSelector.click()])

  // Wait for the new tab to load
  await newPage.waitForLoadState('load')

  expect(newPage.url()).toBe(expectedUrl)

  expect(page.url()).toBe(originalUrl)

  return newPage
}

/**
 * Expects the version dropdown to be visible and to contain the expected versions.
 *
 * @param page The playwright page object.
 * @param selectedVersion: The currently selected version.
 * @param expectedVersions The list of version dropdown items to check for.
 *
 * @returns The version dropdown items.
 */
export const assertVersionDropdown = async (
  page: Page,
  selectedVersion: string,
  expectedVersions: string[]
): Promise<{
  versionDropdown: Locator
  emptyItem: Locator
  showAllItem: Locator
  versionDropdownItems: Locator
}> => {
  const versionDropdown = page.getByTestId(testIDs.header.versionDropdown.main)
  await expect(versionDropdown).toBeVisible()
  await expect(versionDropdown).toContainText(selectedVersion)
  if (!(await page.locator('[role="listbox"]').isVisible())) {
    await versionDropdown.click()
  }
  await expect(page.locator('[role="listbox"]')).toBeVisible()

  const versionDropdownItems = page.locator('[role="listbox"]').getByTestId(testIDs.header.versionDropdown.item)
  const emptyItem = page.getByTestId(testIDs.header.versionDropdown.emptyItem)
  const showAllItem = page.getByTestId(testIDs.header.versionDropdown.showAllItem)
  await expect(emptyItem).toBeVisible()
  await expect(emptyItem).toHaveText('')
  await expect(showAllItem).toBeVisible()
  await expect(showAllItem).toHaveText('...show all')

  await expect(page.getByTestId(testIDs.header.versionDropdown.emptyItem)).toBeVisible()
  await expect(page.getByTestId(testIDs.header.versionDropdown.showAllItem)).toBeVisible()
  await expect(versionDropdownItems).toHaveCount(expectedVersions.length)

  for (const [index, value] of expectedVersions.entries()) {
    await expect(versionDropdownItems.nth(index)).toContainText(value)
  }

  return {
    versionDropdown: versionDropdown,
    emptyItem: emptyItem,
    showAllItem: showAllItem,
    versionDropdownItems: versionDropdownItems,
  }
}

/**
 * Expects the menu bar to be visible and optionally checks for the version dropdown items and logo.
 *
 * @param page The playwright page object.
 * @param logoHref The logo href to check for.
 * @param versionDropdownItems The optional list of version dropdown items to check for.
 * @param logoURL The optional logo URL to check for.
 * @param logoText The optional logo text to check for.
 */
export const assertMenuBar = async (page: Page, logoHref: string, logoURL?: string, logoText?: string) => {
  await expect(page.getByTestId(testIDs.header.main)).toBeVisible()

  const headerLogo = page.getByTestId(testIDs.header.logo.main)
  expect(await headerLogo.evaluate((element: HTMLElement) => element.href)).toBe(logoHref)

  if (logoURL) {
    const logo = page.getByTestId(testIDs.header.logo.image)
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute('src', logoURL)
  }

  if (logoText) {
    const text = page.getByTestId(testIDs.header.logo.text)
    await expect(text).toBeVisible()
    await expect(text).toHaveText(logoText)
  }
}

/**
 * Expects that the index/home page is visible including all project cards.
 *
 * @param page The playwright page object.
 * @param options The optional playwright options.
 */
export const assertIndexPage = async (
  page: Page,
  options?: { timeout?: number; categories?: Record<string, Project[]> }
) => {
  await expect(page).toHaveURL(BASE_URL, { timeout: options?.timeout })
  if (options?.categories) {
    const projectCategories = page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.main)

    // Assert that all categories are visible
    await expect(projectCategories).toHaveCount(Object.keys(options.categories).length)

    for (const [categoryIndex, [category, projects]] of Object.entries(options.categories).entries()) {
      // Assert category title
      await expect(
        page.getByTestId(testIDs.landingPage.projectCategories.projectCategory.title).nth(categoryIndex)
      ).toContainText(category)

      const projectCards = projectCategories
        .nth(categoryIndex)
        .getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.main)
      for (const [projectIndex, project] of projects.entries()) {
        // Assert project title
        await expect(
          projectCards
            .nth(projectIndex)
            .getByTestId(testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.title)
        ).toContainText(project.display_name)

        // Assert documentation button
        await expect(
          projectCards
            .nth(projectIndex)
            .getByTestId(
              testIDs.landingPage.projectCategories.projectCategory.projects.projectCard.actions.documentationLink
            )
        ).toBeVisible()
      }
    }
  }
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

  await expect(page).toHaveURL(`${BASE_URL}/${name}/${version}`)

  await expect(docIframe).toBeVisible({ timeout: 10000 })

  await docIframe.waitFor({ state: 'attached' })
  const iframeDocument = docIframe.contentFrame()
  expect(iframeDocument).not.toBeNull()

  await expect(iframeDocument.locator('html')).toBeVisible({ timeout: 10000 })

  return iframeDocument.locator('html')
}

/**
 * Expects the version overview to be visible and to show the expected versions in the expected order.
 *
 * @param page The playwright page object.
 * @param name The project name.
 * @param expectedVersions The expected versions grouped by major version.
 */
export const assertVersionOverview = async (page: Page, name: string, expectedVersions: Record<string, string[]>) => {
  await expect(page).toHaveURL(`${BASE_URL}/${name}`)

  const majorVersionCards = page.getByTestId(testIDs.project.versionOverview.majorVersionCard.main)

  await expect(majorVersionCards).toHaveCount(Object.keys(expectedVersions).length)

  Object.keys(expectedVersions).forEach(async (majorVersion, index) => {
    const expectedMinorAndPatchVersions = expectedVersions[majorVersion]
    const majorVersionCard = majorVersionCards.nth(index)
    const minorAndPatchVersionItems = majorVersionCard.getByTestId(
      testIDs.project.versionOverview.majorVersionCard.versionItem.main
    )
    await expect(minorAndPatchVersionItems).toHaveCount(expectedMinorAndPatchVersions.length)
    expect(await minorAndPatchVersionItems.allTextContents()).toStrictEqual(expectedMinorAndPatchVersions)
  })
}
