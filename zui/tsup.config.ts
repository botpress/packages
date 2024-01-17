import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  format: ['esm', 'cjs'],
  sourcemap: true,
  keepNames: true,
  experimentalDts: true,
  platform: 'browser',
  clean: true,
  shims: true,
  noExternal: ['zod'],
  bundle: true
})
