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
          const base64 = data.toString('base64')

          // Universal base64 decode: Buffer on Node, atob in browsers.
          const contents = `
            // Inlined WASM file as base64
            const wasmBase64 = "${base64}";
            let bytes;
            if (typeof Buffer !== 'undefined') {
              bytes = Buffer.from(wasmBase64, 'base64');
            } else {
              const bin = atob(wasmBase64);
              bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            }
            export default bytes;
        `
          return { contents, loader: 'js' }
        })
      }
    }
  ]
})
