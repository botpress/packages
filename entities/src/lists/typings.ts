export type ListEntityEngine = 'wasm' | 'javascript'

export type Tokenizer = (utterance: string) => string[]

export type ListEntityValue = {
  name: string
  synonyms: string[]
}

export type FuzzyTolerance = 'loose' | 'medium' | 'strict'

export type ListEntityDef = {
  name: string
  fuzzy: FuzzyTolerance
  values: ListEntityValue[]
}
