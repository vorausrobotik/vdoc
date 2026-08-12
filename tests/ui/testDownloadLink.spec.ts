import fs from 'node:fs'
import { expect } from '@playwright/test'
import test, { prepareTestSuite } from './base'
import { BASE_URL, openProjectDocumentation } from './helpers'

await prepareTestSuite(test)

test('Test download link triggers download instead of navigation', async ({ page }) => {
  // These routes are registered in the test body, which means they are evaluated with LIFO priority
  // over the catch-all route registered in beforeEach. This ensures the download page and XML file
  // are served correctly for this test.

  // Serve the XML file with the appropriate content type for the download request.
  await page.route('*/**/static/projects/example-project-01/3.2.0/_downloads/eni.xml', (route) =>
    route.fulfill({
      contentType: 'application/xml',
      body: fs.readFileSync('tests/ui/resources/mockedDownload.xml'),
    })
  )

  // Override the catch-all to serve the download test page for this specific project version.
  await page.route('*/**/static/projects/example-project-01/3.2.0/*', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: fs.readFileSync('tests/ui/resources/mockedDownloadPage.html'),
    })
  )

  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest', '3.2.0')

  const downloadLink = documentation.getByRole('link', { name: 'eni.xml' })
  await expect(downloadLink).toBeVisible()

  // A download keeps the address that reaches the file. The readable address vdoc puts on every
  // other link answers with vdoc's own application, so rewriting this one would download that.
  expect(await downloadLink.evaluate((link: HTMLAnchorElement) => link.href)).toBe(
    `${BASE_URL}/static/projects/example-project-01/3.2.0/_downloads/eni.xml`
  )

  // Clicking a link with the `download` attribute should trigger a file download, not an iframe navigation.
  const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()])
  expect(download.suggestedFilename()).toBe('eni.xml')
})
