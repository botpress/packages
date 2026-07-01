import { readFileSync } from 'node:fs'

/**
 * Mirror of the tsup `inline-wasm` esbuild plugin for vitest: turns `.wasm` imports
 * into a module whose default export is the raw bytes, so tests can import
 * `wasm/index.ts` (which inlines the tokenizer wasm) without a bundling step.
 *
 * Typed loosely (not `import type { Plugin } from 'vite'`) to avoid the
 * duplicate-vite-instance type clash between the repo root and this package.
 */
export const inlineWasm = () => ({
  name: 'inline-wasm',
  enforce: 'pre' as const,
  load(id: string) {
    if (!id.endsWith('.wasm')) return null
    const base64 = readFileSync(id).toString('base64')
    return `const bytes = Buffer.from(${JSON.stringify(base64)}, 'base64');\nexport default bytes;`
  },
})
