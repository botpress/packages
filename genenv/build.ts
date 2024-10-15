import esbuild from 'esbuild'

void esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: [],
  outdir: './dist',
  sourcemap: true
})
