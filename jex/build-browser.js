const esbuild = require('esbuild')
const { polyfillNode } = require('esbuild-plugin-polyfill-node')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/index.mjs',
    inject: ['shims.js'],
    plugins: [polyfillNode()]
  })
  .catch(() => process.exit(1))
