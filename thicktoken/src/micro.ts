// MICRO entry: cl25k vocab (first 25,000 cl100k merges) — the smallest variant,
// ~230KB gz total and ~5× faster init than the full entry. Counts OVERCOUNT vs
// real cl100k by ~+8-9% on prose/code — safe for budget enforcement (never
// undercounts), NOT for billing math or exact window packing. For the most
// size-starved edge targets; prefer `thicktoken/lite` when in doubt.
// @ts-ignore - resolved by wasm/wasm.d.ts, inlined by the build tooling
import cl25k from '../wasm/assets/cl25k_merges.json.gz'
import { makeGetTokenizer } from './core'

export const getWasmTokenizer = makeGetTokenizer(cl25k)

export {
  TextTokenizer,
  TokenCollection,
  WasmTokenizer,
  type CountOptions,
  type GetTokenizerOptions,
  type TruncateMode,
} from './core'
