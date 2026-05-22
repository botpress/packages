const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: 'dist/index.cjs'
  })
  .catch(() => process.exit(1))
