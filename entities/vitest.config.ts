import { configDefaults, defineConfig } from 'vitest/config'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.util.test.ts']
  },
  plugins: [wasm(), topLevelAwait()]
})
