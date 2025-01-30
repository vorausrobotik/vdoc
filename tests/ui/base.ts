import { test } from '@playwright/test'
import { Page } from '@playwright/test'

const mockAPIRequests = async (page: Page) => {
  const routes = [
    { pattern: '*/**/static/projects/*/*/', response: 'Hello, this is documentation content!' },
    {
      pattern: '*/**/api/projects/',
      response: [{ name: 'example-project-01' }, { name: 'example-project-02' }, { name: 'example-project-03' }],
    },
    {
      pattern: '*/**/api/projects/example-project-01/versions/',
      response: ['0.1.0', '0.2.0', '1.0.0', '2.0.0', '3.0.0', '3.1.0', '3.2.0'],
    },
    {
      pattern: '*/**/api/projects/example-project-01/versions/latest',
      response: ['3.2.0'],
    },
    {
      pattern: '*/**/api/projects/example-project-02/versions/',
      response: ['1.0.0'],
    },
    {
      pattern: '*/**/api/projects/example-project-02/versions/latest',
      response: ['1.0.0'],
    },
    {
      pattern: '*/**/api/projects/example-project-03/versions/',
      response: ['0.1.0', '1.0.0'],
    },
    {
      pattern: '*/**/api/projects/example-project-03/versions/latest',
      response: ['1.0.0'],
    },
  ]
  for (const { pattern, response } of routes) {
    await page.route(pattern, (route) => route.fulfill({ json: response }))
  }
}

test.beforeEach(async ({ page }) => {
  await mockAPIRequests(page)
  await page.goto('/')
})

export default test
