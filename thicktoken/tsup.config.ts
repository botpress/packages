// tsup.config.ts
import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'

export default defineConfig({
  entry: ['src/tokenizer.ts'],
  format: ['cjs', 'esm'],
  platform: 'neutral',
  clean: true,
  bundle: true,
  dts: true,
  shims: true,
  cjsInterop: true,
  esbuildPlugins: [
    {
      name: 'inline-wasm',
      setup(build) {
        build.onLoad({ filter: /\.wasm$/ }, async (args) => {
          const data = readFileSync(args.path)

          const arrayLiteral = Uint8Array.from(data).join(',')
          const base64 = data.toString('base64')
          console.log(arrayLiteral.length, args.path, base64.length)

          const contents = `
          // Inlined WASM file
          // Inlined WASM file as base64
            const wasmBase64 = "${base64}";
            // Node's Buffer is available in our target environment
            const bytes = Buffer.from(wasmBase64, 'base64');
            export default bytes;
            
        `
          return { contents, loader: 'js' }
        })
      }
    }
  ]
})
