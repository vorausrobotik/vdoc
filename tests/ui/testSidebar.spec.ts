import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import { openSettingsSidebar } from './helpers'

await prepareTestSuite(test)

test('App version is displayed in the sidebar', async ({ page }) => {
  await page.goto('/')
  const sidebar = await openSettingsSidebar(page)
  expect(await sidebar.getByTestId(testIDs.sidebar.appVersion).innerText()).toBe('vdoc 42.0.42')
})
