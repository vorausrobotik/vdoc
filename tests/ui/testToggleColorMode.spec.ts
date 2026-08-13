import { type ColorMode, colorModeCycle, type EffectiveColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import test, { prepareTestSuite } from './base'
import { assertCurrentColorMode, assertTheme, switchColorMode } from './helpers'

await prepareTestSuite(test)

test.describe('Color schemes tests', () => {
  test('Color mode should be system by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: undefined })
    await page.goto('/example-project-01/latest')
    await page.waitForLoadState()
    await assertCurrentColorMode(page, 'system')
  })

  test('The app bar toggle cycles through all three color modes', async ({ page }) => {
    // GIVEN: A reader who has never chosen a color mode, so the toggle starts at the default
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/example-project-01/latest')
    await page.waitForLoadState()
    await assertCurrentColorMode(page, 'system')

    // WHEN: They press the single toggle repeatedly
    // THEN: It steps through every mode in order and comes back to where it started
    const toggle = page.getByTestId(testIDs.header.colorModeToggle)
    for (const expectedMode of [...colorModeCycle.slice(1), colorModeCycle[0]]) {
      await toggle.click()
      await assertCurrentColorMode(page, expectedMode)
    }
  })

  test('Theme should be light if preferred color scheme is undefined', async ({ page }) => {
    await page.emulateMedia({ colorScheme: undefined })
    await page.goto('/example-project-01/latest')
    await page.waitForLoadState()
    await assertTheme(page, 'light')
  })

  test('Theme should be light if preferred color scheme is "light"', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/example-project-01/latest')
    await page.waitForLoadState()
    await assertTheme(page, 'light')
  })

  test('Theme should be dark if preferred color scheme is "dark"', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/example-project-01/latest')
    await page.waitForLoadState()
    await assertTheme(page, 'dark')
  })

  const effectiveColorModes: EffectiveColorMode[] = ['dark', 'light']
  const colorModes: ColorMode[] = ['dark', 'light', 'system']
  effectiveColorModes.forEach((preferredColorScheme: EffectiveColorMode) => {
    colorModes.forEach((sourceColorScheme) => {
      colorModes.forEach((targetColorScheme) => {
        test(`Theme should be changeable from ${sourceColorScheme} to ${targetColorScheme} when prefers-color-scheme is ${preferredColorScheme}`, async ({
          page,
        }) => {
          await page.emulateMedia({ colorScheme: preferredColorScheme })
          await page.goto('/example-project-01/latest')
          await page.waitForLoadState()

          // Make sure that the user preferred color scheme is applied
          await assertTheme(page, preferredColorScheme)

          // Switch the color mode to ``sourceColorScheme``
          await switchColorMode(page, sourceColorScheme as ColorMode)
          await assertTheme(page, sourceColorScheme === 'system' ? preferredColorScheme : sourceColorScheme)

          // Switch the color mode to ``targetColorScheme``
          await switchColorMode(page, targetColorScheme as ColorMode)
          await assertTheme(page, targetColorScheme === 'system' ? preferredColorScheme : targetColorScheme)
        })
      })
    })
  })
})
