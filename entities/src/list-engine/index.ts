import * as wasm from './wasm'
import * as node from './node'
import * as types from './typings'

export * from './typings'

const ENGINE: 'wasm' | 'node' = process.env.ENGINE === 'node' ? 'node' : 'wasm'
console.log(`Using ${ENGINE} engine`)

type Exports = {
  extractForListModel: typeof wasm.extractForListModel
  extractForListModels: typeof wasm.extractForListModels
}

const wasmExports: Exports = wasm
const nodeExports: Exports = node

export const extractForListModel = (
  strTokens: string[],
  listModel: types.ListEntityModel
): types.ListEntityExtraction[] => {
  return (ENGINE === 'wasm' ? wasmExports : nodeExports).extractForListModel(strTokens, listModel)
}

export const extractForListModels = (
  strTokens: string[],
  listModels: types.ListEntityModel[]
): types.ListEntityExtraction[] => {
  return (ENGINE === 'wasm' ? wasmExports : nodeExports).extractForListModels(strTokens, listModels)
}
