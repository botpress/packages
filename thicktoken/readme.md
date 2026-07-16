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


## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. Since the packages are catered to our own use-cases, they might have less stable APIs, receive breaking changes without much warning, have minimal documentation and lack community-focused support. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install or fork this package feel absolutely free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
