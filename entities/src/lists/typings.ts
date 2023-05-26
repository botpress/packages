export type ListEntitySynonym = {
  tokens: string[]
}

export type ListEntityValue = {
  name: string
  synonyms: ListEntitySynonym[]
}

export type ListEntityDef = {
  name: string
  fuzzy: number
  values: ListEntityValue[]
}

export type ListEntityExtraction = {
  name: string
  confidence: number
  value: string
  source: string
  char_start: number
  char_end: number
}

export type Tokenizer = (utterance: string) => string[]
