import fs from 'node:fs'
import path from 'node:path'
import type {
  Page,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test'
import test from '@playwright/test'
import type { ColorMode } from '@/interfacesAndTypes/ColorModes'
import type { Project } from '@/interfacesAndTypes/Project'

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

/** Versions as the projects endpoint lists them, oldest first, one day apart. */
const published = (...versions: string[]) =>
  versions.map((version, index) => ({ version, published_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString() }))

/** The projects the projects endpoint answers with. */
export const mockedProjects: Project[] = [
  {
    name: 'example-project-01',
    display_name: 'Example Project 01',
    description: 'The first example',
    category_id: 0,
    visibility: 'listed',
    featured: false,
    featured_label: null,
    versions: published('0.1.0', '0.2.0', '1.0.0', '2.0.0', '3.0.0', '3.1.0', '3.2.0'),
  },
  {
    name: 'example-project-02',
    display_name: null,
    description: null,
    category_id: 1,
    visibility: 'listed',
    featured: false,
    featured_label: null,
    versions: published('1.0.0'),
  },
  {
    name: 'example-project-03',
    display_name: null,
    description: null,
    category_id: null,
    visibility: 'listed',
    featured: false,
    featured_label: null,
    versions: published('0.1.0', '1.0.0'),
  },
]

export const mockAPIRequests = async (page: Page) => {
  const routes = [
    {
      pattern: '*/**/static/projects/**/*',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/mockedIndex.html')) },
    },
    {
      pattern: '*/**/static/projects/**/examples.html*',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/mockedExamples.html')) },
    },
    {
      pattern: '*/**/static/projects/**/search.html*',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/mockedSearch.html')) },
    },
    {
      pattern: '*/**/static/projects/**/style.css',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/style.css')) },
    },
    {
      pattern: '*/**/static/projects/example-project-03/1.0.0/nonexisting.html*',
      response: { body: fs.readFileSync(path.resolve('tests/ui/resources/nonExisting.html')) },
    },
    {
      pattern: '*/**/api/project_categories/',
      response: {
        json: [
          { id: 0, name: 'General', position: 0 },
          { id: 1, name: 'Extensions', position: 1 },
        ],
      },
    },
    {
      pattern: '*/**/api/projects/',
      response: {
        json: mockedProjects,
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
      pattern: '*/**/api/plugins/site/',
      response: {
        json: {
          name: 'site',
          active: false,
          title: null,
          description: null,
          long_description: null,
          show_on_landing_page: true,
          theme: 'default',
        },
      },
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
    appBarColor: 'rgb(18, 18, 18)',
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
