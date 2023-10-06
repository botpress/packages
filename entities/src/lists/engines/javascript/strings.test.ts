import { describe, expect, test } from 'vitest'
import * as stringUtils from './strings'

const expectRounded = (a: number) => ({
  toApproximatelyEqual: (b: number) => {
    const roundedA = Math.round(a * 1000) / 1000
    const roundedB = Math.round(b * 1000) / 1000
    expect(roundedA).toEqual(roundedB)
  }
})

describe('String utils', () => {
  test('levenshtein', () => {
    expect(stringUtils.levenshteinDistance('testing', 'tesing')).toEqual(1) // 1 x suppresion
    expect(stringUtils.levenshteinDistance('testting', 'testing')).toEqual(1) // 1 x addition
    expect(stringUtils.levenshteinDistance('tasting', 'testing')).toEqual(1) // 1 x substitution
    expect(stringUtils.levenshteinDistance('teing', 'testing')).toEqual(2) // 2 x suppression
    expect(stringUtils.levenshteinDistance('tesstting', 'testing')).toEqual(2) // 2 x addition
    expect(stringUtils.levenshteinDistance('teasing', 'testing')).toEqual(2) // 1 x suppression + 1 x addition
    expect(stringUtils.levenshteinDistance('teasing', 'testing')).toEqual(2) // 1 x suppression + 1 x addition
    expect(stringUtils.levenshteinDistance('tastting', 'testing')).toEqual(2) // 1 x substitution + 1 x addition
    expect(stringUtils.levenshteinDistance('tetsng', 'testing')).toEqual(2) // 1 x suppression + 1 x substitution
    expect(stringUtils.levenshteinDistance('tetsing', 'testing')).toEqual(2) // letterSwap (1 sup + 1 add)
    expect(stringUtils.levenshteinDistance('tetsig', 'testing')).toEqual(3) // 1 x suppression + 1 x letterSwap (1 sup + 1 add)
    expect(stringUtils.levenshteinDistance('tetsinng', 'testing')).toEqual(3) // 1 x letterSwap (1 sup + 1 add) + 1 x addition
    expect(stringUtils.levenshteinDistance('tetsinng', 'testing')).toEqual(3) // 1 x letterSwap (1 sup + 1 add) + 1 x addition
    expect(stringUtils.levenshteinDistance('tetsong', 'testing')).toEqual(3) // 1 x letterSwap (1 sup + 1 add) + 1 x substitution
  })

  test('new-york', () => {
    // this is a bug, but we have to keep it for backward compatibility (it should be 3)
    expect(stringUtils.levenshteinDistance('new-york', 'new-yorkers')).toEqual(4)
  })

  test('jaro-winkler', () => {
    expectRounded(stringUtils.jaroWinklerSimilarity('testing', 'tesing')).toApproximatelyEqual(0.967)
    expectRounded(stringUtils.jaroWinklerSimilarity('testting', 'testing')).toApproximatelyEqual(0.975) // 1 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('tasting', 'testing')).toApproximatelyEqual(0.914) // 1 x substitution
    expectRounded(stringUtils.jaroWinklerSimilarity('teing', 'testing')).toApproximatelyEqual(0.924) // 2 x suppression
    expectRounded(stringUtils.jaroWinklerSimilarity('tesstting', 'testing')).toApproximatelyEqual(0.948) // 2 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('teasing', 'testing')).toApproximatelyEqual(0.924) // 1 x suppression + 1 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('teasing', 'testing')).toApproximatelyEqual(0.924) // 1 x suppression + 1 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('tastting', 'testing')).toApproximatelyEqual(0.882) // 1 x substitution + 1 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('tetsing', 'testing')).toApproximatelyEqual(0.962) // letter swap
    expectRounded(stringUtils.jaroWinklerSimilarity('tetsng', 'testing')).toApproximatelyEqual(0.917) // 1 x letter swap + 1 x suppression
    expectRounded(stringUtils.jaroWinklerSimilarity('tetsiing', 'testing')).toApproximatelyEqual(0.929) // 1 x letter swap + 1 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('tetsiing', 'testing')).toApproximatelyEqual(0.929) // 1 x letter swap + 1 x addition
    expectRounded(stringUtils.jaroWinklerSimilarity('tetsong', 'testing')).toApproximatelyEqual(0.879) // 1 x letter swap + 1 x substitution
  })
})
