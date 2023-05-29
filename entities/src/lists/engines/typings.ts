export type ListEntityModel = {
  name: string
  fuzzy: number
  values: { name: string; synonyms: { tokens: string[] }[] }[]
}

export type ListEntityExtraction = {
  name: string
  confidence: number
  value: string
  source: string
  charStart: number
  charEnd: number
}
