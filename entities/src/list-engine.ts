import * as pkg from '../pkg'

export type ListEntityModel = {
  name: string
  fuzzy: number
  tokens: Record<string, string[][]>
}

export type ListEntityExtraction = {
  name: string
  confidence: number
  value: string
  source: string
  char_start: number
  char_end: number
}

export const extractForListModel = (strTokens: string[], listModel: ListEntityModel): ListEntityExtraction[] => {
  return pkg.extract(strTokens, listModel)
}
