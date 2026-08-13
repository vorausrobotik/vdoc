import { expect } from '@playwright/test'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from './base'

await prepareTestSuite(test)

test('App version is displayed in the app bar', async ({ page }) => {
  await page.goto('/')
  const appVersion = page.getByTestId(testIDs.header.main).getByTestId(testIDs.header.appVersion)

  // Read as rendered rather than as text content, because the name and the number are stacked and
  // only the rendered form tells the two lines apart.
  await expect.poll(async () => await appVersion.innerText()).toBe('vdoc\n42.0.42')

  // Muted, rather than the contrast text color the app bar hands down to its children.
  await expect(appVersion).not.toHaveCSS('color', 'rgb(255, 255, 255)')
})
