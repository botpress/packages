export type ListEntityEngine = 'wasm' | 'node'

export type Tokenizer = (utterance: string) => string[]

export type ListEntityValue = {
  name: string
  synonyms: string[]
}

export type ListEntityDef = {
  name: string
  fuzzy: number
  values: ListEntityValue[]
}
