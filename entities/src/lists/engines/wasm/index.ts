import * as wasmData from '@bpinternal/entities-wasm/entities_bg.wasm'
import { init } from '@bpinternal/entities-wasm/init'
import {
  SynonymDefinition,
  StringArray,
  SynonymArray,
  ValueDefinition,
  ExtractionArray,
  ValueArray,
  EntityDefinition,
  EntityExtraction,
  EntityArray,
  extract_multiple
} from '@bpinternal/entities-wasm'
import { ListEntityExtraction, ListEntityModel } from '../typings'
import { WasmVec } from './wasm-vec'

const importWASM = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await init((imports) => WebAssembly.instantiate(wasmData.default, imports))
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return import('@bpinternal/entities-wasm/entities_bg.wasm')
  }
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
  export const mapEntitySynonym = (synonym: Synonym): SynonymDefinition => {
    const wasmTokens = new WasmVec(StringArray).fill(synonym.tokens)
    return new SynonymDefinition(wasmTokens.x)
  }
  export const mapEntityValue = (value: Value): ValueDefinition => {
    const wasmSynonyms = new WasmVec(SynonymArray).fill(value.synonyms.map(mapEntitySynonym))
    return new ValueDefinition(value.name, wasmSynonyms.x)
  }
  export const mapEntityModel = (listModel: ListEntityModel): EntityDefinition => {
    const wasmValues = new WasmVec(ValueArray).fill(listModel.values.map(mapEntityValue))
    return new EntityDefinition(listModel.name, listModel.fuzzy, wasmValues.x)
  }
}

namespace fromRust {
  export const mapEntityExtraction = (wasmExtraction: EntityExtraction): ListEntityExtraction => {
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

  export const mapEntityExtractions = (listExtractions: ExtractionArray): ListEntityExtraction[] => {
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

export const extractForListModels = async (
  strTokens: string[],
  listDefinitions: ListEntityModel[]
): Promise<ListEntityExtraction[]> => {
  await importWASM()
  const wasmStrTokens = new WasmVec(StringArray).fill(strTokens)
  const wasmListDefinitions = new WasmVec(EntityArray).fill(listDefinitions.map(fromJs.mapEntityModel))
  const wasmListExtractions = extract_multiple(wasmStrTokens.x, wasmListDefinitions.x)
  const listExtractions = fromRust.mapEntityExtractions(wasmListExtractions)
  return listExtractions
}
