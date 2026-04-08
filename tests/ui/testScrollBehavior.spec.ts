import { expect, Locator } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'
import {
  waitForIframeReady,
  scrollIframe,
  scrollIframeBelowShowThreshold,
  expectHeaderHidden,
  expectHeaderVisible,
} from './helpers'

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
})
