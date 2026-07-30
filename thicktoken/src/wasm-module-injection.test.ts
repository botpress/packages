/**
 * `getWasmTokenizer({ wasmModule })` — injecting a precompiled engine module, for
 * runtimes that ban runtime WASM compilation (`new WebAssembly.Module(bytes)`),
 * e.g. Cloudflare Workers. Kept in its own file: vitest isolates test files, so
 * the engine is guaranteed uninitialized when the injected module is passed —
 * `initSync` receives the `WebAssembly.Module` and skips runtime compilation.
 */
import { describe, it, expect } from 'vitest'
// @ts-ignore - resolved by the *.wasm module declaration (raw bytes via the vitest inline-wasm plugin)
import wasmBytes from '../wasm/pkg/thicktoken_wasm_bg.wasm'
import { getWasmTokenizer } from './micro'

describe('wasmModule injection', () => {
  it('initializes the engine from a precompiled WebAssembly.Module', async () => {
    const wasmModule = new WebAssembly.Module(wasmBytes as Uint8Array)
    const tokenizer = await getWasmTokenizer({ wasmModule })

    expect(tokenizer.count('Hello, world!', { approximate: false })).toBeGreaterThanOrEqual(4)
    expect(tokenizer.truncate('one two three four', 2)).toBe('one two')
    expect(tokenizer.split('Hello').join('')).toBe('Hello')
  })
})
