import { expect } from '@playwright/test'
import test, { prepareTestSuite } from '../base'
import testIDs from '../../../src/ui/interfacesAndTypes/testIDs'
await prepareTestSuite(test)

const oramaDisabledDataMock = {
  name: 'orama',
  active: false,
}

const oramaEnabledDataMock = {
  name: 'orama',
  endpoint: process.env.VDOC_PLUGINS_ORAMA_ENDPOINT,
  api_key: process.env.VDOC_PLUGINS_ORAMA_API_KEY,
  disable_chat: false,
  facet_property: 'category',
  dictionary: {
    search_placeholder: 'Example search placeholder',
    suggestions: ['Example suggestion 1', 'Example suggestion 2', 'Example suggestion 3'],
    disclaimer: 'Orama can make mistakes. Please verify the information.',
    chat_button_label: 'Get a summary',
  },
  active: true,
}

test.describe('Orama plugin tests', () => {
  test('Orama plugin must not be visible when disabled', async ({ page }) => {
    await page.route('*/**/api/plugins/orama/', (route) =>
      route.fulfill({
        json: oramaDisabledDataMock,
      })
    )
    await page.goto('/')
    await page.waitForLoadState()

    await expect(page.getByTestId(testIDs.plugins.orama.searchButton)).not.toBeVisible()
    await expect(page.getByTestId(testIDs.plugins.orama.searchBox)).not.toBeVisible()
  })

  test('Orama plugin must be visible when enabled', async ({ page }) => {
    await page.route('*/**/api/plugins/orama/', (route) => route.fulfill({ json: oramaEnabledDataMock }))

    await page.goto('/')
    await page.waitForLoadState()

    const searchButton = page.getByTestId(testIDs.plugins.orama.searchButton)

    await expect(searchButton).toBeVisible()
    await expect(page.getByTestId(testIDs.plugins.orama.searchBox)).not.toBeVisible()
    await expect(searchButton).toContainText(oramaEnabledDataMock.dictionary.search_placeholder)
  })

  test('Active orama plugin works as expected', async ({ page }) => {
    await page.route('*/**/api/plugins/orama/', (route) => route.fulfill({ json: oramaEnabledDataMock }))

    await page.goto('/')
    await page.waitForLoadState()

    const searchButton = page.getByTestId(testIDs.plugins.orama.searchButton)
    const searchBox = page.getByTestId(testIDs.plugins.orama.searchBox).locator('#modalContent')

    await expect(searchButton).toBeVisible()
    await expect(searchBox).not.toBeVisible()

    await page.locator('body').press('ControlOrMeta+k')

    await expect(searchBox).toBeVisible()

    // Test search input
    const searchInput = searchBox.getByRole('searchbox', { name: 'Example search placeholder' })
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', oramaEnabledDataMock.dictionary.search_placeholder)

    // Test suggestions
    const suggestions = page.locator('orama-suggestions.sc-orama-search-results')
    await expect(suggestions).toBeVisible()

    const suggestionButtons = suggestions.getByRole('button')
    const suggestionsList = oramaEnabledDataMock.dictionary.suggestions
    await expect(suggestionButtons).toHaveCount(suggestionsList.length)
    for (let i = 0; i < suggestionsList.length; i++) {
      await expect(suggestionButtons.nth(i)).toContainText(suggestionsList[i])
    }

    // Test chat
    const chatButton = searchBox.getByRole('button', { name: oramaEnabledDataMock.dictionary.chat_button_label })
    await expect(chatButton).toBeVisible()
    await expect(chatButton).toHaveText(oramaEnabledDataMock.dictionary.chat_button_label)
    await chatButton.click()

    const disclaimer = page.locator('.sc-orama-text-h').last()
    await expect(disclaimer).toHaveText(oramaEnabledDataMock.dictionary.disclaimer)
  })
})
