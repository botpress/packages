import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.utils.test.ts', '**/*.types.test.ts'],
    browser: {
      provider: 'playwright',
      enabled: true,
      name: 'chromium',
      headless: true
    }
  }
})
