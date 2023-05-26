import * as pkg from '../../pkg'
import { ListEntityExtraction, ListEntityDef } from './typings'

type ArrayOf<T> = { push: (item: T) => void }
const fill = <T, A extends ArrayOf<T>>(arr: A, items: T[]) => {
  items.forEach((item) => arr.push(item))
  return arr
}

const mapListModel = (listModel: ListEntityDef): pkg.EntityDefinition => {
  const values = fill(
    new pkg.ValueArray(),
    listModel.values.map((value) => {
      const synonyms = fill(
        new pkg.SynonymArray(),
        value.synonyms.map((synonym) => new pkg.SynonymDefinition(fill(new pkg.StringArray(), synonym.tokens)))
      )
      return new pkg.ValueDefinition(value.name, synonyms)
    })
  )

  const list_definition = new pkg.EntityDefinition(listModel.name, listModel.fuzzy, values)
  return list_definition
}

const mapExtractions = (list_extractions: pkg.ExtractionArray): ListEntityExtraction[] => {
  const extractions: ListEntityExtraction[] = []
  for (let i = 0; i < list_extractions.len(); i++) {
    const extraction = list_extractions.get(i)
    extractions.push({
      name: extraction.name,
      confidence: extraction.confidence,
      value: extraction.value,
      source: extraction.source,
      char_start: extraction.char_start,
      char_end: extraction.char_end
    })
    // IMPORTANT: free the extraction to avoid memory leaks
    extraction.free()
  }

  // IMPORTANT: free the extraction to avoid memory leaks
  list_extractions.free()
  return extractions
}

export const extractForListModel = (strTokens: string[], listModel: ListEntityDef): ListEntityExtraction[] => {
  const str_tokens = fill(new pkg.StringArray(), strTokens)
  const list_definition = mapListModel(listModel)
  const list_extractions = pkg.extract_single(str_tokens, list_definition)
  return mapExtractions(list_extractions)
}

export const extractForListModels = (strTokens: string[], listModels: ListEntityDef[]): ListEntityExtraction[] => {
  const str_tokens = fill(new pkg.StringArray(), strTokens)
  const list_definitions = fill(new pkg.EntityArray(), listModels.map(mapListModel))
  const list_extractions = pkg.extract_multiple(str_tokens, list_definitions)
  return mapExtractions(list_extractions)
}
