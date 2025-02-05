import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/ui',
  timeout: 30000,
  retries: 0,
  fullyParallel: true,
  reporter: [['html', { open: 'never' }]],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
  use: {
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
