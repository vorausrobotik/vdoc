import { expect, Locator } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import {
  waitForIframeReady,
  scrollIframe,
  scrollIframeBelowShowThreshold,
  expectHeaderHidden,
  expectHeaderVisible,
  getContentPadding,
} from './helpers'
import { FooterPluginT } from '../../src/ui/interfacesAndTypes/plugins/FooterPlugin'

await prepareTestSuite(test)

test.describe('Scroll behavior', () => {
  let iframe: Locator
  let header: Locator

  test.beforeEach(async ({ page }) => {
    await page.goto('/example-project-01/1.0.0/')
    iframe = page.getByTestId(testIDs.project.documentation.documentationIframe)
    header = page.getByTestId(testIDs.header.main)
    await waitForIframeReady(iframe)
  })

  test('should hide app bar when scrolling down', async () => {
    await test.step('scroll down past hide threshold', async () => {
      await scrollIframe(iframe, 800)
    })

    await test.step('verify header is hidden', async () => {
      await expectHeaderHidden(header)
    })
  })

  test('should show app bar when scrolling back up', async () => {
    await test.step('scroll down to hide header', async () => {
      await scrollIframe(iframe, 800)
      await expectHeaderHidden(header)
    })

    await test.step('scroll back up below show threshold', async () => {
      await scrollIframeBelowShowThreshold(iframe)
    })

    await test.step('verify header is visible again', async () => {
      await expectHeaderVisible(header)
    })
  })

  test('should show scroll-to-top button when scrolled down', async ({ page }) => {
    const scrollToTopButton = page.getByTestId(testIDs.scrollToTop)

    await test.step('scroll down', async () => {
      await scrollIframe(iframe, 800)
    })

    await test.step('verify scroll-to-top button appears', async () => {
      await expect(scrollToTopButton).toBeVisible({ timeout: 5000 })
    })
  })

  test('should scroll to top when clicking scroll-to-top button', async ({ page }) => {
    const scrollToTopButton = page.getByTestId(testIDs.scrollToTop)

    await test.step('scroll down and wait for button', async () => {
      await scrollIframe(iframe, 800)
      await expect(scrollToTopButton).toBeVisible({ timeout: 5000 })
    })

    await test.step('click scroll-to-top', async () => {
      await scrollToTopButton.click()
    })

    await test.step('verify scrolled back to top', async () => {
      await expect(async () => {
        const scrollTop = await iframe.evaluate((el: HTMLIFrameElement) => {
          return el.contentWindow?.scrollY || 0
        })
        expect(scrollTop).toBeLessThan(50)
      }).toPass({ timeout: 3000 })
    })
  })

  const footerEnabledMock: FooterPluginT = {
    name: 'footer',
    active: true,
    links: [
      {
        title: 'Links',
        icon: 'public',
        links: [{ title: 'Home', icon: 'home', href: 'https://example.com', target: '_blank' }],
      },
    ],
    copyright: 'Test GmbH',
  }

  const footerDisabledMock: FooterPluginT = {
    name: 'footer',
    active: false,
  }

  test('content padding should match app bar and footer height when footer is enabled', async ({ page }) => {
    await page.route('*/**/api/plugins/footer/', (route) => route.fulfill({ json: footerEnabledMock }))
    await page.goto('/example-project-01/1.0.0/')
    const footer = page.getByTestId(testIDs.plugins.footer.main)
    await expect(footer).toBeVisible()

    await expect(async () => {
      const { paddingTop, paddingBottom } = await getContentPadding(page)
      const headerBox = (await header.boundingBox())!
      const footerBox = (await footer.boundingBox())!

      expect(paddingTop).toBeCloseTo(headerBox.height, 0)
      expect(paddingBottom).toBeCloseTo(footerBox.height, 0)
    }).toPass({ timeout: 5000 })
  })

  test('content padding should match app bar height when footer is disabled', async ({ page }) => {
    await page.route('*/**/api/plugins/footer/', (route) => route.fulfill({ json: footerDisabledMock }))
    await page.goto('/example-project-01/1.0.0/')
    await expect(page.getByTestId(testIDs.plugins.footer.main)).not.toBeVisible()

    await expect(async () => {
      const { paddingTop, paddingBottom } = await getContentPadding(page)
      const headerBox = (await header.boundingBox())!

      expect(paddingTop).toBeCloseTo(headerBox.height, 0)
      expect(paddingBottom).toBe(0)
    }).toPass({ timeout: 5000 })
  })
})
