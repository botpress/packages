// tsup.config.ts
import { defineConfig, type Options } from 'tsup'
import { readFileSync } from 'fs'

// Inlines binary assets as bytes, decoded from base64 at import time.
// Universal base64 decode: Buffer on Node, atob in browsers.
const inlineBinaryPlugin = (filter: RegExp): NonNullable<Options['esbuildPlugins']>[number] => ({
  name: 'inline-binary',
  setup(build) {
    build.onLoad({ filter }, async (args) => {
      const data = readFileSync(args.path)
      const base64 = data.toString('base64')

      const contents = `
        // Inlined binary file as base64
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
  },
})

export default defineConfig([
  // Default build: everything inlined (engine .wasm + vocab .gz) so the package
  // works everywhere without path resolution — Node, browsers, bundlers, Lambda.
  {
    entry: ['src/tokenizer.ts', 'src/lite.ts', 'src/micro.ts'],
    format: ['cjs', 'esm'],
    platform: 'neutral',
    clean: true,
    bundle: true,
    dts: true,
    shims: true,
    cjsInterop: true,
    esbuildPlugins: [inlineBinaryPlugin(/\.(wasm|gz)$/)],
  },
  // Workerd (Cloudflare Workers) build: runtime WASM compilation is banned there,
  // so the engine .wasm ships as a separate dist file and stays a static import —
  // the runtime compiles it at deploy time and the module resolves to a
  // precompiled WebAssembly.Module. Vocab .gz assets are plain data and stay inlined.
  {
    entry: {
      'tokenizer.workerd': 'src/tokenizer.ts',
      'lite.workerd': 'src/lite.ts',
      'micro.workerd': 'src/micro.ts',
    },
    format: ['esm'],
    platform: 'neutral',
    clean: false,
    bundle: true,
    dts: false,
    shims: false,
    loader: { '.wasm': 'copy' },
    esbuildOptions(options) {
      // Stable (unhashed) filename so the engine module is importable at a fixed
      // path (exported as "./engine.wasm") for explicit wasmModule injection.
      options.assetNames = '[name]'
    },
    esbuildPlugins: [inlineBinaryPlugin(/\.gz$/)],
  },
])
