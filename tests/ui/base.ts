import test from '@playwright/test'
import type {
  TestType,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ColorMode } from '../../src/ui/interfacesAndTypes/ColorModes'
import fs from 'fs'
import path from 'path'

export const prepareTestSuite = async (
  test: TestType<PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>
) => {
  test.beforeEach(async ({ page }) => {
    await mockAPIRequests(page)
  })

  test.afterEach(async ({ page }) => {
    await page.unrouteAll()
  })
}

export const mockAPIRequests = async (page: Page) => {
  const routes = [
    {
      pattern: '*/**/static/projects/**/*',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/mockedIndex.html')) },
    },
    {
      pattern: '*/**/static/projects/**/examples.html',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/mockedExamples.html')) },
    },
    {
      pattern: '*/**/static/projects/**/style.css',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/style.css')) },
    },
    {
      pattern: '*/**/static/projects/example-project-03/1.0.0/nonexisting.html',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/nonExisting.html')) },
    },
    {
      pattern: '*/**/api/project_categories/',
      response: {
        json: [
          { id: 0, name: 'General' },
          { id: 1, name: 'Extensions' },
        ],
      },
    },
    {
      pattern: '*/**/api/projects/',
      response: {
        json: [
          { name: 'example-project-01', display_name: 'Example Project 01', category_id: 0 },
          { name: 'example-project-02', display_name: 'example-project-02', category_id: 1 },
          { name: 'example-project-03', display_name: 'example-project-03', category_id: null },
        ],
      },
    },
    {
      pattern: '*/**/api/projects/example-project-01/versions/',
      response: { json: ['0.1.0', '0.2.0', '1.0.0', '2.0.0', '3.0.0', '3.1.0', '3.2.0'] },
    },
    {
      pattern: '*/**/api/projects/example-project-01/versions/latest',
      response: { json: '3.2.0' },
    },
    {
      pattern: '*/**/api/projects/example-project-01/versions/42.0.0',
      response: {
        status: 404,
        body: JSON.stringify({
          message: "Project 'example-project-01' doesn't have a documentation for version '42.0.0'",
        }),
      },
    },
    {
      pattern: '*/**/api/projects/example-project-02/versions/',
      response: { json: ['1.0.0'] },
    },
    {
      pattern: '*/**/api/projects/example-project-02/versions/latest',
      response: { json: '1.0.0' },
    },
    {
      pattern: '*/**/api/projects/example-project-03/versions/',
      response: { json: ['0.1.0', '1.0.0'] },
    },
    {
      pattern: '*/**/api/projects/example-project-03/versions/latest',
      response: { json: '1.0.0' },
    },
    {
      pattern: '*/**/api/settings/logo_url/light',
      response: { json: 'https://logos.vorausrobotik.com/voraus-robotik_farbig_rgb.png' },
    },
    {
      pattern: '*/**/api/settings/logo_url/dark',
      response: { json: 'https://logos.vorausrobotik.com/voraus-robotik_farbig_negativ_rgb.png' },
    },
  ]
  for (const { pattern, response } of routes) {
    await page.route(pattern, (route) => route.fulfill(response))
  }
}

interface ColorModeProps {
  appBarColor: string
  backgroundColor: string
  errorColor: string
  successColor: string
}

export const themes: Pick<Record<ColorMode, ColorModeProps>, 'light' | 'dark'> = {
  dark: {
    appBarColor: 'rgba(0, 0, 0, 0)',
    backgroundColor: 'rgb(18, 18, 18)',
    errorColor: 'rgb(214, 17, 22)',
    successColor: 'rgb(102, 187, 106)',
  },
  light: {
    appBarColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(227, 242, 253)',
    errorColor: 'rgb(211, 47, 47)',
    successColor: 'rgb(46, 125, 50)',
  },
}

export default test
