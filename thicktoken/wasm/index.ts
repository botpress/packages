/**
 * Typed, ergonomic wrapper around the generated wasm-bindgen bindings.
 *
 * The raw binding (pkg/thicktoken_wasm.js) exposes loosely-typed methods
 * (`mode: string`, mandatory `approximate` bool). This wrapper narrows them to a
 * proper API: a `TruncateMode` union, `approximate` defaulting to **on**, and
 * negative-index support on `slice` (matching JS Array.slice), which is what the
 * llmz truncator relies on.
 *
 * The underlying BPE engine is the `tokie` crate (MIT © Chonkie, Inc.) — see
 * ../NOTICE. cl100k_base encoding.
 */
import { initSync, WasmTokenizer as RawTokenizer } from './pkg/thicktoken_wasm.js'
// Default build: inlined by the build tooling (tsup/vitest inline-wasm plugin) as raw
// bytes, compiled at runtime. Workerd build: emitted as a separate dist .wasm file and
// statically imported, so the runtime hands us a precompiled WebAssembly.Module
// (runtime WASM compilation is banned on Cloudflare Workers). initSync accepts both.
// @ts-ignore - resolved by the *.wasm module declaration
import wasmBinary from './pkg/thicktoken_wasm_bg.wasm'

let initialized = false
const ensureInit = (wasmModule?: WebAssembly.Module) => {
  if (!initialized) {
    initSync({ module: wasmModule ?? wasmBinary })
    initialized = true
  }
}

export interface CreateOptions {
  /**
   * Precompiled engine module, for runtimes that ban runtime WASM compilation
   * (`new WebAssembly.Module(bytes)`), e.g. Cloudflare Workers. Build it from a
   * statically imported `.wasm` file and inject it here. Ignored if the engine
   * is already initialized.
   */
  wasmModule?: WebAssembly.Module
}

/** Which part of the text to preserve when truncating. */
export type TruncateMode = 'head' | 'tail' | 'middle'

export interface CountOptions {
  /**
   * When true (default), large inputs are counted by statistical sampling —
   * orders of magnitude faster, within a few %. Small inputs
   * are always counted exactly. Set false to force an exact count.
   */
  approximate?: boolean
}

export class WasmTokenizer {
  private constructor(private readonly raw: RawTokenizer) {}

  /**
   * Build a tokenizer from a gzip'd merges-only asset (one of wasm/assets/*.gz —
   * full cl100k, lite cl50k, or micro cl25k; see wasm/scripts/gen-assets.mjs).
   */
  static create(assetGz: Uint8Array, options: CreateOptions = {}): WasmTokenizer {
    ensureInit(options.wasmModule)
    return new WasmTokenizer(new RawTokenizer(assetGz))
  }

  /** The vocabulary size (100,263 for cl100k). */
  get vocabSize(): number {
    return this.raw.vocabSize()
  }

  /**
   * Count tokens. Approximate by default for large inputs; pass
   * `{ approximate: false }` for an exact count.
   */
  count(text: string, options: CountOptions = {}): number {
    return this.raw.count(text, options.approximate ?? true)
  }

  /** Encode to token ids. */
  encode(text: string): Uint32Array {
    return this.raw.encode(text)
  }

  /** One decoded string per token (lossy per-token, like a lenient TextDecoder). */
  split(text: string): string[] {
    return this.raw.split(text)
  }

  /** Decode token ids back to a string. */
  decode(ids: Uint32Array): string {
    return this.raw.decode(ids)
  }

  /**
   * Truncate `text` to at most `maxTokens` tokens, keeping:
   *  - `'head'`   — the first N tokens (default)
   *  - `'tail'`   — the last N tokens
   *  - `'middle'` — the first N/2 and last N/2, dropping the middle
   *
   * Exact, and fast even on huge inputs (only tokenizes the window it needs).
   */
  truncate(text: string, maxTokens: number, mode: TruncateMode = 'head'): string {
    if (maxTokens <= 0) return ''
    return this.raw.truncate(text, maxTokens, mode)
  }

  /**
   * Return the substring covered by tokens `[start, end)` (end exclusive, like
   * `Array.prototype.slice`). Negative indices count from the end. `end` omitted
   * means "to the end". Exact — indices are resolved inside the wasm against the
   * single encode pass (no separate count call).
   */
  slice(text: string, start = 0, end?: number): string {
    return this.raw.slice(text, start, end)
  }
}
