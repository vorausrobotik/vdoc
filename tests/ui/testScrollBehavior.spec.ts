import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'

await prepareTestSuite(test)

test.describe('Scroll behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/example-project-01/1.0.0/')
    const iframe = page.getByTestId(testIDs.project.documentation.documentationIframe)
    await iframe.waitFor({ state: 'attached' })
  })

  test('should hide app bar and footer when scrolling down', async ({ page }) => {
    const header = page.getByTestId(testIDs.header.main)
    const iframe = page.getByTestId(testIDs.project.documentation.documentationIframe)

    await iframe.evaluate((iframe: HTMLIFrameElement) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.scrollTo(0, 800)
        iframe.contentWindow.dispatchEvent(new Event('scroll'))
      }
    })

    await expect(async () => {
      const rect = await header.boundingBox()
      expect(rect).toBeTruthy()
      expect(rect!.y).toBeLessThan(-50)
    }).toPass({ timeout: 3000 })
  })

  test('should show app bar and footer when scrolling up', async ({ page }) => {
    const header = page.getByTestId(testIDs.header.main)
    const iframe = page.getByTestId(testIDs.project.documentation.documentationIframe)

    // First scroll to top to reset state
    await iframe.evaluate((iframe: HTMLIFrameElement) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.scrollTo(0, 0)
        iframe.contentWindow.dispatchEvent(new Event('scroll'))
      }
    })

    // Wait for header to be visible
    await expect(async () => {
      const rect = await header.boundingBox()
      expect(rect).toBeTruthy()
      expect(rect!.y).toBeGreaterThanOrEqual(0)
    }).toPass({ timeout: 2000 })

    // Now scroll down to hide the header
    await iframe.evaluate((iframe: HTMLIFrameElement) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.scrollTo(0, 800)
        iframe.contentWindow.dispatchEvent(new Event('scroll'))
      }
    })

    // Wait for header to be hidden
    await expect(async () => {
      const rect = await header.boundingBox()
      expect(rect).toBeTruthy()
      expect(rect!.y).toBeLessThan(-50)
    }).toPass({ timeout: 3000 })

    // Finally scroll back up to show the header again
    await iframe.evaluate((iframe: HTMLIFrameElement) => {
      if (iframe.contentWindow) {
        // Scroll below the show threshold (2.5% of viewport height)
        // to ensure the app bar slides back into view
        const showThreshold = iframe.contentWindow.innerHeight * 0.025
        iframe.contentWindow.scrollTo(0, showThreshold - 5) // 5px below threshold
        iframe.contentWindow.dispatchEvent(new Event('scroll'))
      }
    })

    // Give the Slide transition time to complete (default is 225ms)
    await page.waitForTimeout(500)

    await expect(async () => {
      const rect = await header.boundingBox()
      expect(rect).toBeTruthy()
      expect(rect!.y).toBeGreaterThanOrEqual(0)
      expect(rect!.y).toBeLessThan(20)
    }).toPass({ timeout: 5000 })
  })

  test('should show scroll to top button when scrolled down', async ({ page }) => {
    const scrollToTopButton = page.getByTestId(testIDs.scrollToTop)
    const iframe = page.getByTestId(testIDs.project.documentation.documentationIframe)

    await iframe.evaluate((iframe: HTMLIFrameElement) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.scrollTo(0, 800)
        iframe.contentWindow.dispatchEvent(new Event('scroll'))
      }
    })

    await expect(async () => {
      const rect = await scrollToTopButton.boundingBox()
      expect(rect).toBeTruthy()
      expect(rect!.y).toBeGreaterThanOrEqual(0)
    }).toPass({ timeout: 5000 })
  })

  test('should scroll to top when clicking scroll to top button', async ({ page }) => {
    const scrollToTopButton = page.getByTestId(testIDs.scrollToTop)
    const iframe = page.getByTestId(testIDs.project.documentation.documentationIframe)

    await iframe.evaluate((iframe: HTMLIFrameElement) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.scrollTo(0, 800)
        iframe.contentWindow.dispatchEvent(new Event('scroll'))
      }
    })

    await expect(scrollToTopButton).toBeVisible({ timeout: 5000 })
    await scrollToTopButton.click()

    await expect(async () => {
      const scrollTop = await iframe.evaluate((iframe: HTMLIFrameElement) => {
        return iframe.contentWindow?.scrollY || 0
      })
      expect(scrollTop).toBeLessThan(50)
    }).toPass({ timeout: 3000 })
  })
})
