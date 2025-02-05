import { expect } from '@playwright/test'
import test from './base'
import { openProjectDocumentation } from './helpers'

test('Test link substitution', async ({ page }) => {
  const documentation = await openProjectDocumentation(page, 'example-project-01', 'latest')

  // Expect the documentation iframe to display the mocked documentation page
  await expect(documentation).toContainText('Hello, this is a mocked documentation component.')

  // Ensure that all links have been substituted correctly
  const links = documentation.getByRole('link')
  await expect(links).toHaveCount(3)
  const expectedSubstitutedLinks = [
    'http://localhost:3000/example-project-01/latest/#',
    'http://localhost:3000/example-project-01/latest/index.html',
    'https://www.sphinx-doc.org/',
  ]
  for (const [index, expectedLink] of expectedSubstitutedLinks.entries()) {
    expect(await links.nth(index).getAttribute('href')).toBe(expectedLink)
  }
})
