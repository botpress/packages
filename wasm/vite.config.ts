import wasm from 'vite-plugin-wasm'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [wasm(), topLevelAwait(), dts()],
  resolve: {
    alias: {
      path: 'path-browserify'
    }
  },
  build: {
    lib: {
      entry: 'src/tokenizer.ts',
      formats: ['es'],
      fileName: (format) => `tokenizer.js`
    },
    rollupOptions: {
      input: 'src/tokenizer.ts',
      output: {
        // ensure that the wasm file is included in the same chunk as the js file
        manualChunks: () => 'tokenizer'
      },
      external: (id) => /\.test\.ts$/.test(id) || id.includes('__tests')
    }
  }
})
