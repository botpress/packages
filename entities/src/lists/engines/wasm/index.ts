import * as pkg from '../../../../pkg'
import { ListEntityExtraction, ListEntityModel } from '../typings'
import { WasmVec } from './wasm-vec'
import { isBrowser } from 'browser-or-node'

let initialized = false
const maybeInitialize = () => {
  if (initialized) {
    return
  }
  if (isBrowser) {
    pkg.init() // this might break on some browsers
  }
  initialized = true
}

/**
 * IMPORTANT:
 *
 *   Inputs of wasm functions don't have to be freed. Worse: if they are freed, the program will crash.
 *   It seems that, someone in the process is responsible for freeing them, but I don't know who.
 *   It is not really clear in the wasm-bindgen documentation, and the generated code is not easy to read.
 *
 *   However, outputs of wasm functions must be freed, otherwise there will be memory leaks.
 */

type Model = ListEntityModel
type Value = Model['values'][number]
type Synonym = Value['synonyms'][number]

namespace fromJs {
  export const mapEntitySynonym = (synonym: Synonym): pkg.SynonymDefinition => {
    const wasmTokens = new WasmVec(pkg.StringArray).fill(synonym.tokens)
    return new pkg.SynonymDefinition(wasmTokens.x)
  }
  export const mapEntityValue = (value: Value): pkg.ValueDefinition => {
    const wasmSynonyms = new WasmVec(pkg.SynonymArray).fill(value.synonyms.map(mapEntitySynonym))
    return new pkg.ValueDefinition(value.name, wasmSynonyms.x)
  }
  export const mapEntityModel = (listModel: ListEntityModel): pkg.EntityDefinition => {
    const wasmValues = new WasmVec(pkg.ValueArray).fill(listModel.values.map(mapEntityValue))
    return new pkg.EntityDefinition(listModel.name, listModel.fuzzy, wasmValues.x)
  }
}

namespace fromRust {
  export const mapEntityExtraction = (wasmExtraction: pkg.EntityExtraction): ListEntityExtraction => {
    const extraction = {
      name: wasmExtraction.name,
      confidence: wasmExtraction.confidence,
      value: wasmExtraction.value,
      source: wasmExtraction.source,
      charStart: wasmExtraction.char_start,
      charEnd: wasmExtraction.char_end
    }

    // IMPORTANT: free the extraction to avoid memory leaks
    wasmExtraction.free()

    return extraction
  }

  export const mapEntityExtractions = (listExtractions: pkg.ExtractionArray): ListEntityExtraction[] => {
    const extractions: ListEntityExtraction[] = []
    for (let i = 0; i < listExtractions.len(); i++) {
      const extraction = listExtractions.get(i)
      extractions.push(mapEntityExtraction(extraction))
    }

    // IMPORTANT: free the extraction to avoid memory leaks
    listExtractions.free()

    return extractions
  }
}

export const extractForListModels = (
  strTokens: string[],
  listDefinitions: ListEntityModel[]
): ListEntityExtraction[] => {
  maybeInitialize()
  const wasmStrTokens = new WasmVec(pkg.StringArray).fill(strTokens)
  const wasmListDefinitions = new WasmVec(pkg.EntityArray).fill(listDefinitions.map(fromJs.mapEntityModel))
  const wasmListExtractions = pkg.extract_multiple(wasmStrTokens.x, wasmListDefinitions.x)
  const listExtractions = fromRust.mapEntityExtractions(wasmListExtractions)
  return listExtractions
}
