import * as pkg from '../pkg'

export const levenshteinSimilarity = (a: string, b: string): number => {
  return pkg.levenshtein_sim(a, b)
}

export const jaroWinklerSimilarity = (a: string, b: string): number => {
  return pkg.jaro_winkler_sim(a, b)
}

export const levenshteinDistance = (a: string, b: string): number => {
  return pkg.levenshtein_dist(a, b)
}
