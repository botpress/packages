# thicktoken-wasm

thicktoken's WebAssembly cl100k_base tokenizer engine (backing `src/tokenizer.ts`).
It wraps the [`tokie`](https://github.com/feyninc/tokie)
BPE crate (MIT © Chonkie, Inc. — see `../NOTICE`) compiled to wasm32, with a thin typed
JS wrapper (`index.ts`, class `WasmTokenizer`).

**API** (`index.ts`): `count(text, {approximate})`, `encode`, `decode`, `split`,
`truncate(text, maxTokens, 'head'|'tail'|'middle')`, `slice(text, start, end)` (negative
indices allowed). `count` is approximate-by-default on large inputs (statistical sampling);
`truncate`/`slice` are exact and use an optimistic char window so they never tokenize the
whole input when the kept range is small.

**Vocab is embedded merges-only** (`assets/cl100k_merges.json.gz`, ~469 KB gz). The full
`model.vocab` is dropped — fully derivable for a topological/tiktoken-style BPE. At init,
`src/lib.rs` inflates the asset (`miniz_oxide`) and builds the encoder **directly** from
merge id-pairs via tokie's `BytePairEncoder::from_merges_with_added` (no JSON round-trip,
no Aho-Corasick automaton). ids 0–255 = the gpt2 byte-level base alphabet (in
`bytes_to_unicode` order, not raw byte order), id 256+i = the i-th merge's concatenation,
specials from `added_tokens`. Result: `.wasm` ~848 KB raw / ~594 KB gz, ~44 ms init (on
par with tiktoken). Token output verified byte-identical to tiktoken.

## Rebuild

Requires a Rust toolchain (≥ 1.85 for edition 2024) + wasm-pack:

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
wasm-pack build --release --target nodejs --out-dir pkg
```

The built `pkg/` is committed so the package builds and tests without a Rust toolchain.
`target/` is gitignored. Note: the bundled `wasm-opt` needs `--enable-bulk-memory` (set in
`Cargo.toml` `[package.metadata.wasm-pack.profile.release]`).

To regenerate the merges asset from a fresh `tokenizer.json`:
```sh
node -e "const j=JSON.parse(require('fs').readFileSync('tokenizer.json'));require('fs').writeFileSync('/tmp/a.json',JSON.stringify({merges:j.model.merges,added_tokens:j.added_tokens,pre_tokenizer:j.pre_tokenizer}))"
gzip -9c /tmp/a.json > assets/cl100k_merges.json.gz
```
