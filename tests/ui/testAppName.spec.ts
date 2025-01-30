import { expect } from '@playwright/test'
import test from './base'

test('Test App Title', async ({ page }) => {
  await expect(page).toHaveTitle('vdoc')
})
