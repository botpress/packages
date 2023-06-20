import _ from 'lodash'
import { ListEntityExtraction, ListEntityModel } from '../typings'
import * as strings from './strings'
import * as toks from './tokens'

const ENTITY_SCORE_THRESHOLD = 0.6

const computeExactScore = (a: string[], b: string[]): number => {
  const str1 = a.join('')
  const str2 = b.join('')
  const min = Math.min(str1.length, str2.length)
  const max = Math.max(str1.length, str2.length)
  let score = 0
  for (let i = 0; i < min; i++) {
    if (str1[i] === str2[i]) {
      score++
    }
  }
  return score / max
}

const computeFuzzyScore = (a: string[], b: string[]): number => {
  const str1 = a.join('')
  const str2 = b.join('')
  const d1 = strings.levenshteinSimilarity(str1, str2)
  const d2 = strings.jaroWinklerSimilarity(str1, str2, { caseSensitive: false })
  return (d1 + d2) / 2
}

const computeStructuralScore = (a: string[], b: string[]): number => {
  const charset1 = _.uniq(a.map((x) => x.split('')).flat())
  const charset2 = _.uniq(b.map((x) => x.split('')).flat())
  const charset_score = _.intersection(charset1, charset2).length / _.union(charset1, charset2).length
  const charsetLow1 = charset1.map((c) => c.toLowerCase())
  const charsetLow2 = charset2.map((c) => c.toLowerCase())
  const charset_low_score = _.intersection(charsetLow1, charsetLow2).length / _.union(charsetLow1, charsetLow2).length
  const final_charset_score = _.mean([charset_score, charset_low_score])

  const la = Math.max(1, a.filter((x) => x.length > 1).length)
  // BUG: using a here instead of b is a bug, but we have to keep it for compatibility
  const lb = Math.max(1, a.filter((x) => x.length > 1).length)
  const token_qty_score = Math.min(la, lb) / Math.max(la, lb)

  const size1 = _.sumBy(a, (x) => x.length)
  const size2 = _.sumBy(b, (x) => x.length)
  const token_size_score = Math.min(size1, size2) / Math.max(size1, size2)

  const ret = Math.sqrt(final_charset_score * token_qty_score * token_size_score)

  return ret
}

type Candidate = {
  struct_score: number
  length_score: number // structural score adjusted by the length of the synonym to favor longer matches

  token_start: number
  token_end: number

  // name: string // fruit
  value: string // Watermelon (typeof fruit)
  synonym: string // melons (from ['water', '-', 'melon'])
  source: string // mellons (from fuzzy match)

  eliminated: boolean
}

type FlatSynonym = {
  name: string
  fuzzy: number
  value: string
  tokens: string[]
  max_synonym_length: number
}

const low = (str: string) => str.toLowerCase()

const extractForSynonym = (tokens: toks.Token[], synonym: FlatSynonym): Candidate[] => {
  const candidates: Candidate[] = []
  const synonymStr = synonym.tokens.join('')

  for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
    if (tokens[tokenIdx].isSpace) {
      continue
    }

    const workset = toks.takeUntil(tokens, tokenIdx, synonymStr.length).map((x) => x.value)
    const source = workset.join('')

    const isFuzzy = synonym.fuzzy < 1 && source.length >= 4

    const exact_score = computeExactScore(workset, synonym.tokens)
    const exact_factor = exact_score === 1 ? 1 : 0

    const fuzzy_score = computeFuzzyScore(workset.map(low), synonym.tokens.map(low))
    const fuzzy_factor = fuzzy_score >= synonym.fuzzy ? fuzzy_score : 0

    const used_factor = isFuzzy ? fuzzy_factor : exact_factor
    const structural_score = used_factor * computeStructuralScore(workset, synonym.tokens)

    // we want to favor longer matches (but is obviously less important than score)
    // so we take its length into account (up to the longest candidate)
    const used_length = Math.min(source.length, synonym.max_synonym_length)
    const length_score = structural_score * Math.pow(used_length, 0.2)

    candidates.push({
      struct_score: structural_score,
      length_score,

      value: synonym.value,

      token_start: tokenIdx,
      token_end: tokenIdx + workset.length - 1,

      source,
      synonym: synonymStr,

      eliminated: false
    })
  }

  return candidates
}

export const extractForListModel = (strTokens: string[], listModel: ListEntityModel): ListEntityExtraction[] => {
  const uttTokens = toks.toTokens(strTokens)

  const synonyms: FlatSynonym[] = listModel.values.flatMap((value) => {
    const max_synonym_length: number = Math.max(...value.synonyms.map(({ tokens }) => tokens.join('').length))

    return value.synonyms.map((synonym) => ({
      name: listModel.name,
      fuzzy: listModel.fuzzy,
      value: value.name,
      tokens: synonym.tokens,
      max_synonym_length
    }))
  })

  const candidates: Candidate[] = []
  for (const synonym of synonyms) {
    const newCandidates = extractForSynonym(uttTokens, synonym)
    candidates.push(...newCandidates)
  }

  // B) eliminate overlapping candidates

  for (let tokenIdx = 0; tokenIdx < uttTokens.length; tokenIdx++) {
    const tokenCandidates = candidates.filter((c) => c.token_start <= tokenIdx && c.token_end >= tokenIdx)
    const activeTokenCandidates = tokenCandidates.filter((c) => !c.eliminated)

    // we use length adjusted score to favor longer matches
    const rankedTokenCandidates = _.orderBy(activeTokenCandidates, (c) => c.length_score, 'desc')

    const [winner, ...losers] = rankedTokenCandidates
    if (!winner) {
      continue
    }

    for (const loser of losers) {
      loser.eliminated = true
    }
  }

  const winners = candidates.filter((c) => !c.eliminated)

  // C) from winners keep only matches with high enough structural score

  const matches = winners.filter((x) => x.struct_score >= ENTITY_SCORE_THRESHOLD)

  // D) map to results

  const results: ListEntityExtraction[] = matches.map((match) => ({
    name: listModel.name,
    confidence: match.struct_score,
    charStart: uttTokens[match.token_start].startChar,
    charEnd: uttTokens[match.token_end].endChar,
    value: match.value,
    source: match.source
  }))
  return results
}

export const extractForListModels = (strTokens: string[], listModels: ListEntityModel[]): ListEntityExtraction[] => {
  const results: ListEntityExtraction[] = []
  for (const listModel of listModels) {
    const newResults = extractForListModel(strTokens, listModel)
    results.push(...newResults)
  }
  return results
}
