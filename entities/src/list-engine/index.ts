import * as wasm from './wasm'
import * as node from './node'
import * as types from './typings'

export * from './typings'

const ENGINE: 'wasm' | 'node' = process.env.ENGINE === 'node' ? 'node' : 'wasm'
console.log(`Using ${ENGINE} engine`)

type Exports = {
  levenshteinSimilarity: typeof wasm.levenshteinSimilarity
  jaroWinklerSimilarity: typeof wasm.jaroWinklerSimilarity
  levenshteinDistance: typeof wasm.levenshteinDistance
  extractForListModel: typeof wasm.extractForListModel
}

const wasmExports: Exports = wasm
const nodeExports: Exports = node

export const levenshteinSimilarity = (a: string, b: string): number => {
  return (ENGINE === 'wasm' ? wasmExports : nodeExports).levenshteinSimilarity(a, b)
}
export const jaroWinklerSimilarity = (a: string, b: string): number => {
  return (ENGINE === 'wasm' ? wasmExports : nodeExports).jaroWinklerSimilarity(a, b)
}
export const levenshteinDistance = (a: string, b: string): number => {
  return (ENGINE === 'wasm' ? wasmExports : nodeExports).levenshteinDistance(a, b)
}
export const extractForListModel = (
  strTokens: string[],
  listModel: types.ListEntityModel
): types.ListEntityExtraction[] => {
  return (ENGINE === 'wasm' ? wasmExports : nodeExports).extractForListModel(strTokens, listModel)
}
