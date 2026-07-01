# ThickToken

A bundled cl100k tokenizer with added helper functions (count / truncate / split), powered
by our own Rust→WASM build (see `wasm/`, engine: [tokie](https://github.com/feyninc/tokie),
MIT © Chonkie, Inc. — see `NOTICE`). Historically backed by tiktoken — the API is unchanged.

- `count(text, { approximate })` — approximate **by default** on large inputs (statistical
  sampling, within a few %, ~100× faster); pass `{ approximate: false }` for exact.
- `truncate(text, n)` — exact; keeps the first `n` tokens (negative `n` removes from the
  end). Only tokenizes the window it needs, so it's fast on huge inputs.
- `split(text)` / `splitAndSlice(text)` — per-token strings / sliceable collection.


## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. Since the packages are catered to our own use-cases, they might have less stable APIs, receive breaking changes without much warning, have minimal documentation and lack community-focused support. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install or fork this package feel absolutely free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
