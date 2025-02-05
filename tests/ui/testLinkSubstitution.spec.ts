import { expect } from '@playwright/test'
import test from './base'
import testIDs from '../../src/ui/interfacesAndTypes/testIDs'

test('Test link substitution', async ({ page }) => {
  await page.goto('/')

  const docIframe = page.getByTestId(testIDs.project.documentation.documentationIframe)
  const expectedDocumentationContent = 'Hello, this is a mocked documentation component.'
  const basePath = 'http://localhost:3000'

  // Expect the documentation iframe to display the mocked documentation page
  await page.goto('/example-project-01/latest')
  await expect(docIframe.contentFrame().locator('html')).toContainText(expectedDocumentationContent)

  // Ensure that all links have been substituted correctly
  const links = docIframe.contentFrame().getByRole('link')
  await expect(links).toHaveCount(3)
  const expectedSubstitutedLinks = [
    `${basePath}/example-project-01/latest/#`,
    `${basePath}/example-project-01/latest/index.html`,
    'https://www.sphinx-doc.org/',
  ]
  for (const [index, expectedLink] of expectedSubstitutedLinks.entries()) {
    expect(await links.nth(index).getAttribute('href')).toBe(expectedLink)
  }
})
