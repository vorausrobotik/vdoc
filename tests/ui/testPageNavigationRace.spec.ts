import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { BASE_URL } from './helpers'

await prepareTestSuite(test)

/**
 * Regression test for BUGS-7690:
 *
 * When navigating from a page whose URL contains a hash (e.g. config_files.html#axes-limits)
 * to another page via a link inside the iframe (e.g. limits.html#limitset), the iframe
 * sometimes "bounces back" to the original page: the target page loads, then the original
 * page is force-loaded again (at the top, since the new hash doesn't exist there).
 *
 * The race only manifests while the route loader is pending, because useLocation() updates
 * at navigation start while route.useParams() only updates after the loaders resolve.
 * The loader performs two sequential API calls, so realistic API latency opens the window.
 * We simulate that latency here by delaying the version API endpoints.
 */

const API_DELAY_MS = 300

test.beforeEach(async ({ page }) => {
  // Delay the two version API endpoints awaited by the /$projectName/$version/$ route loader.
  // Registered after the base mocks, so these take precedence.
  for (const version of ['3.2.0', 'latest']) {
    await page.route(`*/**/api/projects/example-project-01/versions/${version}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS))
      await route.fulfill({ json: '3.2.0' })
    })
  }
})

test('Navigating from a hashed URL to another page must not bounce back (BUGS-7690)', async ({ page }) => {
  // GIVEN: The user is on a documentation page with an anchor in the URL
  await page.goto('/example-project-01/3.2.0/index.html#section1')

  const iframe = page.getByTestId('project.documentation.documentationIframe')
  const iframeDocument = iframe.contentFrame()
  await expect(iframeDocument.locator('#section1')).toBeInViewport()
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/3.2.0/index.html#section1`)

  // Track every page that gets (re-)loaded into the iframe from now on
  const iframeLoads: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/static/projects/') && request.url().endsWith('.html')) {
      iframeLoads.push(new URL(request.url()).pathname)
    }
  })

  // WHEN: The user clicks a link to another documentation page
  await iframeDocument.getByRole('link', { name: "Link with href 'examples.html'" }).click()

  // THEN: The examples page must be shown
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/3.2.0/examples.html`)
  await expect(iframeDocument.locator('h1')).toContainText('This is a mocked examples page')

  // AND: It must still be shown after all pending router navigation have settled
  await page.waitForTimeout(4 * API_DELAY_MS)
  await expect(page).toHaveURL(`${BASE_URL}/example-project-01/3.2.0/examples.html`)
  await expect(iframeDocument.locator('h1')).toContainText('This is a mocked examples page')

  // AND: The iframe must have loaded examples.html exactly once and must never
  // have bounced back to the original page
  expect(iframeLoads).toStrictEqual(['/static/projects/example-project-01/3.2.0/examples.html'])
})
