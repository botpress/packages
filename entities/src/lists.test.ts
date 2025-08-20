import { describe, expect, test } from 'vitest'
import { ListEntityDef, ListEntityEngine, ListEntityExtractor } from './lists'
import { EntityExpectations, ListEntityAssert } from './lists.util.test'

/**
 * This test suite is really old (year 2020).
 * It can be traced back to botpress v12.10.8 and **before** (commit 7beb86ad5384d683ad868d3662e5f57eced89214).
 * see: https://github.com/botpress/botpress/blob/7beb86ad5384d683ad868d3662e5f57eced89214/modules/nlu/src/backend/entities/list-extractor.test.ts
 */

const listEntities: ListEntityDef[] = [
  {
    name: 'fruit',
    fuzzy: 'medium',
    values: [
      {
        name: 'Blueberry',
        synonyms: ['blueberries', 'blueberry', 'blue berries', 'blue berry', 'poisonous blueberry']
      },
      { name: 'Strawberry', synonyms: ['strawberries', 'strawberry', 'straw berries', 'straw berry'] },
      { name: 'Raspberry', synonyms: ['raspberries', 'raspberry', 'rasp berries', 'rasp berry'] },
      { name: 'Apple', synonyms: ['apple', 'apples', 'red apple', 'yellow apple'] }
    ]
  },
  {
    name: 'company',
    fuzzy: 'medium',
    values: [{ name: 'Apple', synonyms: ['Apple', 'Apple Computers', 'Apple Corporation', 'Apple Inc'] }]
  },
  {
    name: 'airport',
    fuzzy: 'medium',
    values: [
      { name: 'JFK', synonyms: ['JFK', 'New-York', 'NYC'] },
      { name: 'SFO', synonyms: ['SFO', 'SF', 'San-Francisco'] },
      { name: 'YQB', synonyms: ['YQB', 'Quebec', 'Quebec city', 'QUEB'] }
    ]
  }
]

describe.each(['wasm', 'javascript'] satisfies ListEntityEngine[])('%s list entity extractor', (engine) => {
  const extractor = new ListEntityExtractor(listEntities, { engine })
  const entityAssert = new ListEntityAssert(extractor)
  const entityTest = <T extends string>(utt: T, ...tags: EntityExpectations<T>): void =>
    test(utt, () => entityAssert.expectSpans(utt).toBe(...tags))

  test('Data structure test', async () => {
    entityAssert.expectSpans('[Blueberries] are berries that are blue').toBe({
      source: 'Blueberries',
      qty: 1,
      value: 'Blueberry',
      name: 'fruit',
      confidence: 0.9
    })
  })

  describe('exact match', () => {
    entityTest('[Blueberries] are berries that are blue', {
      qty: 1,
      name: 'fruit',
      value: 'Blueberry',
      confidence: 0.9
    })
    entityTest('[Blue berries] are berries that are blue', {
      qty: 1,
      name: 'fruit',
      value: 'Blueberry',
      confidence: 0.9
    })
    entityTest('[blueberry] are berries that are blue', {
      qty: 1,
      name: 'fruit',
      value: 'Blueberry',
      confidence: 0.9
    })
    entityTest('blueberry [are berries that are blue]', { qty: 0 }) // are berries match rasp berries
    entityTest(
      'but [strawberries] are red unlike [blueberries]',
      { qty: 1, value: 'Strawberry' },
      { qty: 1, value: 'Blueberry' }
    )
    entityTest('[but] strawberries [are red unlike] blueberries', { qty: 0 }, { qty: 0 })
    entityTest('an [apple] can be a fruit but also [apple corporation]', { qty: 2 }, { qty: 2 })
    entityTest('that is a [poisonous blueberry]', { qty: 1, value: 'Blueberry', confidence: 1 })
    entityTest('the [red apple] corporation', { qty: 2, name: 'fruit', confidence: 0.9 })
    entityTest('the red [apple corporation]', { qty: 2 })
    entityTest('the [red] apple [corporation]', { qty: 1 }, { qty: 1 })
    entityTest('[apple]', { qty: 2 })
    entityTest('[apple inc]', { qty: 2 })
    entityTest(
      '[SF] is where I was born, I now live in [Quebec] [the city]',
      { qty: 1, name: 'airport' },
      { qty: 1, name: 'airport' },
      { qty: 0 }
    )
  })

  test('same occurrence in multiple entities extracts multiple entities', () => {
    // arrange
    const testEntities: ListEntityDef[] = [
      ...listEntities,
      {
        name: 'state',
        fuzzy: 'medium',
        values: [{ name: 'NewYork', synonyms: ['New York'] }]
      },
      {
        name: 'city',
        fuzzy: 'medium',
        values: [{ name: 'NewYork', synonyms: ['New York'] }]
      }
    ]
    const extractor = new ListEntityExtractor(testEntities, { engine })

    const utterance = 'I want to go to New York'

    // act
    const results = extractor.extract(utterance)

    // assert
    expect(results.length).toEqual(3)
  })

  describe('fuzzy match', () => {
    describe('loose fuzzy', () => {
      entityTest('[Qebec citty] is a city within [QC], a provice.', { qty: 1, value: 'YQB' }, { qty: 0 })
      entityTest(
        'A quaterback is also called a [QB] and [sn francisco] used to have one',
        { qty: 0 },
        { qty: 1, value: 'SFO' }
      )
      entityTest(
        '[sn frncisco] is nice but for [New-Yorkers] [new-yrk] is better',
        { qty: 0 },
        { qty: 0 },
        { qty: 1, value: 'JFK' }
      )
      entityTest("I never been to [kbec city] but I've been to [kebec city]", { qty: 0 }, { qty: 1, value: 'YQB' })
      entityTest("Let's go to [Nova-York]", { qty: 0 })
    })

    describe('missing characters', () => {
      entityTest('[Bluebrries] are berries that are blue', { qty: 1, value: 'Blueberry' })
      entityTest('[Blueberies] are berries that are blue', { qty: 1, value: 'Blueberry' })
      entityTest('[Bluberies] are berries that are blue', { qty: 1, value: 'Blueberry' })
      entityTest('that is a [poisonous bleberry]', { qty: 1, value: 'Blueberry', confidence: 0.9 }) // the longer the word, the more we tolerate mistakes
      entityTest('that is a [poisonus bleberry]', { qty: 1, value: 'Blueberry', confidence: 0.8 }) // prefer 'poisonous blueberry' to 'blueberry'
    })

    describe('added chars', () => {
      entityTest('[apple] [corporations] [inc]', { qty: 2 }, { qty: 1 }, { qty: 0 }) // corporation with a S
      entityTest('[Apple a Corporation]', { name: 'company' })
      entityTest('[apple] [coroporations] [inc]', { qty: 2 }, { qty: 1 }, { qty: 0 }) // too many added chars
      entityTest('[Apple] [build Computers]', { qty: 2 }, { qty: 0 })
      entityTest('[apple] [Zcoroporationss] [inc]', { qty: 2 }, { qty: 0 }, { qty: 0 })
    })

    describe('too many missing chars', () => {
      entityTest('[ale]', { qty: 0 })
      entityTest('[Blberies] are berries that are blue', { qty: 0 })
      entityTest('[bberries] are berries that are blue', { qty: 0 })
      entityTest('that is a [poison] [blueberry]', { qty: 0 }, { qty: 1, value: 'Blueberry', confidence: 0.9 }) // prefer 'blueberry' to 'poisonous blueberry'
      entityTest('[blberries] are berries that are blue', { qty: 1 })
      entityTest('[bberries are berries that are blue]', { qty: 0 })
    })

    describe('casing issues', () => {
      entityTest('[queb] is the place', { qty: 1, value: 'YQB', confidence: 0.7 })
      entityTest('[Queb] is the place', { qty: 1, value: 'YQB', confidence: 0.75 })
      entityTest('[QUeb] is the place', { qty: 1, value: 'YQB', confidence: 0.8 })
      entityTest('[QUEb] is the place', { qty: 1, value: 'YQB', confidence: 0.85 })
      entityTest('[QUEB] is the place', { qty: 1, value: 'YQB', confidence: 0.9 })
      entityTest('[yqb] is the place', { qty: 0 }) // less than 4 chars

      // casing + typos
      // this will need better structural scoring

      // entityTest('[AppLe] is a company, not a fruit', { qty: 1, name: 'company' })
      // entityTest('[aple]', { qty: 1 })
    })

    describe('bad keystrokes', () => {
      // minor
      entityTest('[blurberries] are berries that are blue', { qty: 1, value: 'Blueberry', confidence: 0.8 })
      entityTest('[poisoneouss blurberry] are berries that are blue', { qty: 1, value: 'Blueberry', confidence: 0.8 })

      // major

      entityTest('[vluqberries] are berries that are blue', { qty: 0 })
      // entityTest('[blumbeerries] are berries that are blue', { qty: 0 }) // this needs keyboard distance computation
      // entityTest('[bluabarrias] are berries that are blue', { qty: 0 }) // this needs keyboard distance computation

      // minor letter reversal
      entityTest('[blueebrries] are berries that are blue', { qty: 1, value: 'Blueberry' })

      // letter reversal + missing char
      entityTest('[lbuberries] are berries that are blue', { qty: 0 })
    })

    // no others
    entityTest('Blueberries [are berries that are blue]', { qty: 0 })
  })
})
