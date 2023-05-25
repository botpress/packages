import * as pkg from '../../pkg'
import { ListEntityExtraction, ListEntityModel } from './typings'

export const levenshteinSimilarity = (a: string, b: string): number => {
  return pkg.levenshtein_sim(a, b)
}

export const jaroWinklerSimilarity = (a: string, b: string): number => {
  return pkg.jaro_winkler_sim(a, b)
}

export const levenshteinDistance = (a: string, b: string): number => {
  return pkg.levenshtein_dist(a, b)
}

type ArrayOf<T> = { push: (item: T) => void }
const fill = <T, A extends ArrayOf<T>>(arr: A, items: T[]) => {
  items.forEach((item) => arr.push(item))
  return arr
}

export const extractForListModel = (strTokens: string[], listModel: ListEntityModel): ListEntityExtraction[] => {
  const str_tokens = fill(new pkg.StringArray(), strTokens)

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

  const list_extractions = pkg.extract(str_tokens, list_definition)

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
    extraction.free()
  }
  list_extractions.free()

  return extractions
}
