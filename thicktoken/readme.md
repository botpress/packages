# ThickToken

A bundled cl100k tokenizer with added helper functions (count / truncate / split), powered
by our own Rust→WASM build (see `wasm/`, engine: [tokie](https://github.com/feyninc/tokie),
MIT © Chonkie, Inc. — see `NOTICE`). Historically backed by tiktoken — the API is unchanged.

- `count(text, { approximate })` — approximate **by default** on large inputs (statistical
  sampling, within a few %, ~100× faster); pass `{ approximate: false }` for exact.
- `truncate(text, n)` — exact; keeps the first `n` tokens (negative `n` removes from the
  end). Only tokenizes the window it needs, so it's fast on huge inputs.
- `split(text)` / `splitAndSlice(text)` — per-token strings / sliceable collection.

## Variants (edge / size-sensitive targets)

Same API, smaller vocab (truncated cl100k merges — valid BPE by prefix-closure). One shared
wasm engine; each entry bundles only its own vocab asset. Regenerate assets with
`node wasm/scripts/gen-assets.mjs`.

| import | vocab | total gz (ESM) | init | counts vs cl100k |
| --- | --- | ---: | ---: | --- |
| `@bpinternal/thicktoken` | cl100k (full) | ~647 KB | ~60 ms | exact |
| `@bpinternal/thicktoken/lite` | cl50k | ~392 KB | ~25 ms | overcounts ~+3-7% |
| `@bpinternal/thicktoken/micro` | cl25k | ~275 KB | ~13 ms | overcounts ~+8-20% |

Truncated variants only ever **overcount** — safe for budget enforcement (they trim a bit
more, never overflow a window). Do **not** use them for billing math or exact window
packing; inflation is content-dependent (worst on emoji/unicode-dense text).

## Cloudflare Workers (workerd)

workerd bans runtime WASM compilation (`new WebAssembly.Module(bytes)`), so the default
builds — which inline the engine WASM as base64 and compile it at import time — can't run
there. Two mechanisms handle this:

1. **`workerd` export condition (zero-config).** Bundlers/runtimes that honor the
   `workerd` condition (wrangler does) resolve every entry to a `*.workerd.mjs` build in
   which the engine `.wasm` ships as a **separate dist file** and stays a **static
   import** — workerd compiles it at deploy time and hands the module to `initSync`
   precompiled. On workerd, the root `@bpinternal/thicktoken` entry resolves to the
   **micro** (cl25k) asset — the smallest footprint, and prompt budgeting doesn't need
   exact cl100k counts. Use `@bpinternal/thicktoken/full` if you really need exact cl100k
   counts on Workers.

2. **`getWasmTokenizer({ wasmModule })` (explicit injection).** Pass your own precompiled
   `WebAssembly.Module` (e.g. from a static `.wasm` import) and the engine skips runtime
   compilation entirely:

   ```ts
   import { getWasmTokenizer } from '@bpinternal/thicktoken/micro'
   import wasmModule from '@bpinternal/thicktoken/engine.wasm' // static import
   const tokenizer = await getWasmTokenizer({ wasmModule })
   ```

The vocab `.gz` assets are plain data (inflated inside the WASM engine) and stay inlined
in every build — only the engine `.wasm` needs the special handling.

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. Since the packages are catered to our own use-cases, they might have less stable APIs, receive breaking changes without much warning, have minimal documentation and lack community-focused support. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install or fork this package feel absolutely free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
