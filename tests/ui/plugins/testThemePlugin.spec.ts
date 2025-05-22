import test, { prepareTestSuite } from '../base'
import type { EffectiveColorMode } from '../../../src/ui/interfacesAndTypes/ColorModes'
import { assertMenuBar, BASE_URL } from '../helpers'
await prepareTestSuite(test)

test.describe('Theme plugin tests', () => {
  const mockedPluginPayload = {
    name: 'theme',
    active: true,
    light: {
      logo_url: 'https://example.com/logo_light.png',
    },
    dark: {
      logo_url: 'https://example.com/logo_dark.png',
    },
  }
  const effectiveColorModes: EffectiveColorMode[] = ['dark', 'light']
  effectiveColorModes.forEach((preferredColorScheme: EffectiveColorMode) => {
    test(`Theme plugin works as expected in ${preferredColorScheme} mode`, async ({ page }) => {
      await page.route('*/**/api/plugins/theme/', (route) => route.fulfill({ json: mockedPluginPayload }))

      await page.emulateMedia({ colorScheme: preferredColorScheme })
      await page.goto('/')
      await page.waitForLoadState()
      await assertMenuBar(page, `${BASE_URL}/`, mockedPluginPayload[preferredColorScheme].logo_url)
    })
  })
})
