const esbuild = require('esbuild')
const { polyfillNode } = require('esbuild-plugin-polyfill-node')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: 'dist/index.cjs',
    plugins: [polyfillNode()]
  })
  .catch(() => process.exit(1))
