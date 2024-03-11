import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  format: ['cjs'],
  sourcemap: true,
  keepNames: true,
  dts: true,
  clean: true,
  shims: true,
  bundle: true,
})
