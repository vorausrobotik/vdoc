import { defineConfig } from 'vitest/config'

export default defineConfig({
  // As in vite.config.ts, which this configuration does not read
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['src/ui/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/ui/helpers/'],
      reportsDirectory: 'coverage/ui/unit/',
    },
    reporters: ['junit', 'default'],
    outputFile: './reports/coverage-vitest.xml',
  },
})
