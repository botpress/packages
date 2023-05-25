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

export const extractForListModel = (strTokens: string[], listModel: ListEntityModel): ListEntityExtraction[] => {
  return pkg.extract(strTokens, listModel)
}
