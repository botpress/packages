// Default entry: FULL cl100k vocab — token counts exactly match OpenAI's
// cl100k_base (GPT-3.5/4). Use this wherever counts feed billing or must agree
// with the provider. For edge/size-sensitive targets see `thicktoken/lite`
// (cl50k, ~half the size, ~3× faster init, overcounts ~+3-4%) and
// `thicktoken/micro` (cl25k, overcounts ~+8-9%).
// @ts-ignore - resolved by wasm/wasm.d.ts, inlined by the build tooling
import cl100k from '../wasm/assets/cl100k_merges.json.gz'
import { makeGetTokenizer } from './core'

export const getWasmTokenizer = makeGetTokenizer(cl100k)

export { TextTokenizer, TokenCollection, WasmTokenizer, type CountOptions, type TruncateMode } from './core'
