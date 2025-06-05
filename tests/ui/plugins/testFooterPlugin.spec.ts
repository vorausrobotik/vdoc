import { expect } from '@playwright/test'
import test, { prepareTestSuite } from '../base'
import testIDs from '../../../src/ui/interfacesAndTypes/testIDs'
import { FooterPluginT } from '../../../src/ui/interfacesAndTypes/plugins/FooterPlugin'
await prepareTestSuite(test)

const footerDisabledDataMock: FooterPluginT = {
  name: 'footer',
  active: false,
}

const footerEnabledDataMock: FooterPluginT = {
  name: 'footer',
  copyright: 'Example GmbH',
  links: [
    {
      title: 'Submit Feedback',
      icon: 'bugs',
      links: [
        {
          title: 'Email',
          icon: 'email',
          href: 'mailto:service@example.com',
        },
        {
          title: 'Service Board',
          icon: 'support',
          href: 'https://example.com',
        },
      ],
    },
    {
      title: 'Links',
      icon: 'public',
      links: [
        {
          title: 'example.com',
          icon: 'home',
          href: 'https://example.com',
        },
        {
          title: 'GitHub',
          icon: 'github',
          href: 'https://github.com/example/',
        },
      ],
    },
  ],
  active: true,
}

test.describe('Footer plugin tests', () => {
  const sites = ['/', '/example-project-01/latest/', '/example-project-01/']
  sites.forEach((site: string) => {
    test(`Footer plugin must not be visible on site ${site} when inactive`, async ({ page }) => {
      // GIVEN: The footer plugin is inactive
      await page.route('*/**/api/plugins/footer/', (route) =>
        route.fulfill({
          json: footerDisabledDataMock,
        })
      )
      // WHEN: The user navigates to the tested page
      await page.goto(site)
      await page.waitForLoadState()

      // THEN: The footer must not be visible
      await expect(page.getByTestId(testIDs.plugins.footer.main)).not.toBeVisible()
    })
  })
  sites.forEach((site: string) => {
    test(`Footer plugin must be visible on site ${site} when active`, async ({ page }) => {
      // GIVEN: The footer plugin is active
      await page.route('*/**/api/plugins/footer/', (route) =>
        route.fulfill({
          json: footerEnabledDataMock,
        })
      )
      // WHEN: The user navigates to the tested page
      await page.goto(site)
      await page.waitForLoadState()

      // THEN: The footer must be visible
      await expect(page.getByTestId(testIDs.plugins.footer.main)).toBeVisible()

      // THEN: The copyright must be visible
      await expect(page.getByTestId(testIDs.plugins.footer.copyright)).toHaveText(
        `© ${new Date().getFullYear()} Example GmbH`
      )

      // THEN: All link groups must be visible
      const linkGroups = page.getByTestId(testIDs.plugins.footer.linkGroup.main)
      await expect(linkGroups).toHaveCount(2)

      // THEN: All links must be visible and have correct values
      const expectedLinks = [
        {
          title: 'Email',
          href: 'mailto:service@example.com',
        },
        {
          title: 'Service Board',
          href: 'https://example.com',
        },
        {
          title: 'example.com',
          href: 'https://example.com',
        },
        {
          title: 'GitHub',
          href: 'https://github.com/example/',
        },
      ]
      const linkLocators = page.getByTestId(testIDs.plugins.footer.linkGroup.link.main)
      await expect(linkLocators).toHaveCount(expectedLinks.length)
      for (const [index, link] of expectedLinks.entries()) {
        await expect(linkLocators.nth(index)).toHaveText(link.title)
        await expect(linkLocators.nth(index)).toHaveAttribute('href', link.href)
      }
    })
  })
})
