import { expect, type Page } from '@playwright/test'
import type { Project } from '@/interfacesAndTypes/Project'
import test, { prepareTestSuite } from './base'

await prepareTestSuite(test)

const projects: Project[] = [
  {
    name: 'example-project-01',
    display_name: 'One',
    description: null,
    category_id: 0,
    visibility: 'listed',
    featured: false,
    featured_label: null,
    versions: [
      { version: '1.0.0', published_at: '2026-01-01T10:00:00' },
      { version: '2.0.0', published_at: '2026-02-01T10:00:00' },
    ],
  },
  {
    name: 'retired-project',
    display_name: null,
    description: null,
    category_id: null,
    visibility: 'locked',
    featured: false,
    featured_label: null,
    versions: [{ version: '0.1.0', published_at: '2025-01-01T10:00:00' }],
  },
]

const mockAdminAPI = async (page: Page, options: { loggedIn: boolean }) => {
  let loggedIn = options.loggedIn
  await page.route('*/**/api/auth/me', (route) =>
    loggedIn ? route.fulfill({ json: 'someone' }) : route.fulfill({ status: 401, json: { message: 'Invalid' } })
  )
  await page.route('*/**/api/auth/login', (route) => {
    loggedIn = true
    return route.fulfill({ status: 204 })
  })
  await page.route('*/**/api/projects/?include_hidden=true', (route) => route.fulfill({ json: projects }))
  await page.route(/\/api\/projects\/[^/?]+$/, (route) => route.fulfill({ json: route.request().postDataJSON() }))
  await page.route(/\/api\/projects\/[^/]+\/versions\/[^/]+$/, (route) => route.fulfill({ status: 204 }))
  await page.route('*/**/api/project_categories/', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 201, json: { id: 7, ...route.request().postDataJSON() } })
      : route.fallback()
  )
  await page.route(/\/api\/project_categories\/\d+$/, (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: { id: 0, ...route.request().postDataJSON() } })
  )
}

test('Admin pages send to the login and back', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: false })

  await page.goto('/admin/projects')
  await expect(page).toHaveURL(/\/admin\/login/)

  await page.locator('input[name=username]').fill('someone')
  await page.locator('input[name=password]').fill('secret')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('row', { name: /One/ })).toBeVisible()
})

test('Admin projects list shows hidden projects', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/projects')

  await expect(page.getByRole('row', { name: /One/ })).toContainText('General')
  await expect(page.getByRole('row', { name: /One/ })).toContainText('2.0.0')
  await expect(page.getByRole('row', { name: /retired-project/ })).toContainText('Misc')
  await expect(page.getByRole('row', { name: /retired-project/ })).toContainText('Locked')
})

test('Admin project page saves the presentation', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/projects')
  await page.getByRole('row', { name: /One/ }).click()
  await expect(page).toHaveURL(/\/admin\/projects\/example-project-01$/)

  await page.getByLabel('Description').fill('What it is')
  const update = page.waitForRequest((request) => request.method() === 'PUT')
  await page.getByRole('button', { name: 'Save' }).click()

  expect((await update).postDataJSON()).toMatchObject({ name: 'example-project-01', description: 'What it is' })
})

test('Admin projects list features a project with its star', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/projects')
  const star = page.getByRole('row', { name: /One/ }).getByRole('button', { name: 'Feature on the landing page' })
  const update = page.waitForRequest((request) => request.method() === 'PUT')
  await star.click()

  expect((await update).postDataJSON()).toMatchObject({ name: 'example-project-01', featured: true })
  // The star is not the row, so starring a project does not open it
  await expect(page).toHaveURL(/\/admin\/projects$/)
})

test('Admin project page deletes a version after asking', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/projects/example-project-01')
  await page
    .getByRole('row', { name: /1\.0\.0/ })
    .getByRole('button', { name: 'Delete' })
    .click()
  const deletion = page.waitForRequest((request) => request.method() === 'DELETE')
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click()

  expect((await deletion).url()).toMatch(/\/api\/projects\/example-project-01\/versions\/1\.0\.0$/)
  await expect(page.getByText('Version 1.0.0 deleted')).toBeVisible()
})

test('Admin categories list counts their projects', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/categories')

  await expect(page.getByRole('row', { name: /General/ })).toContainText('1')
})

test('Admin project page creates a category from what was typed', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/projects/retired-project')
  await page.getByRole('combobox').nth(0).fill('Tools')
  const creation = page.waitForRequest((request) => request.method() === 'POST')
  await page.getByRole('option', { name: 'Add "Tools"' }).click()
  expect((await creation).postDataJSON()).toEqual({ name: 'Tools' })

  const update = page.waitForRequest((request) => request.method() === 'PUT')
  await page.getByRole('button', { name: 'Save' }).click()
  expect((await update).postDataJSON()).toMatchObject({ name: 'retired-project', category_id: 7 })
  await expect(page.getByText('Element updated')).toBeVisible()
})

test('Admin categories are created, renamed and deleted', async ({ page }) => {
  await mockAdminAPI(page, { loggedIn: true })

  await page.goto('/admin/categories/create')
  await page.locator('input[name=name]').fill('Tools')
  const creation = page.waitForRequest((request) => request.method() === 'POST')
  await page.getByRole('button', { name: 'Save' }).click()
  expect((await creation).postDataJSON()).toEqual({ name: 'Tools' })

  await page.goto('/admin/categories/0')
  await page.locator('input[name=name]').fill('Basics')
  const rename = page.waitForRequest((request) => request.method() === 'PUT')
  await page.getByRole('button', { name: 'Save' }).click()
  expect((await rename).postDataJSON()).toEqual({ name: 'Basics' })

  await page.goto('/admin/categories/0')
  await page.getByRole('button', { name: 'Delete' }).click()
  const deletion = page.waitForRequest((request) => request.method() === 'DELETE')
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click()
  expect((await deletion).url()).toMatch(/\/api\/project_categories\/0$/)
})
