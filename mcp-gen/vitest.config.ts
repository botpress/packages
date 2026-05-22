import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'src/index.ts' // CLI entry point, tested manually
      ]
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist']
  }
})
