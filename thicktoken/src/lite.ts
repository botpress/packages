// LITE entry: cl50k vocab (first 50,000 cl100k merges — a valid smaller BPE by
// prefix-closure). ~340KB gz total and ~3× faster init than the full entry.
// Counts OVERCOUNT vs real cl100k by ~+3-4% on prose/code — safe for budget
// enforcement (never undercounts), NOT for billing math or exact window packing.
// @ts-ignore - resolved by wasm/wasm.d.ts, inlined by the build tooling
import cl50k from '../wasm/assets/cl50k_merges.json.gz'
import { makeGetTokenizer } from './core'

export const getWasmTokenizer = makeGetTokenizer(cl50k)

export { TextTokenizer, TokenCollection, WasmTokenizer, type CountOptions, type TruncateMode } from './core'
