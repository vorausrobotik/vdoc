import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
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
