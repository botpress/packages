import { test, expect } from 'vitest'
import { PatternEntityDef, PatternEntityExtractor } from './patterns'

test('pattern entity extractor should extract', () => {
  const setsAndReps: PatternEntityDef = {
    name: 'sets_and_reps',
    pattern: '[1-9][0-9]? ?x ?[1-9][0-9]?' // 3x10, 5x5
  }
  const extractor = new PatternEntityExtractor([setsAndReps])

  const utterance_405_3x5 = 'I did squats with 405 for 3x5'
  //                         012345678901234567890123456789
  //                         000000000011111111112222222222
  const utterance_315_4x12 = 'Yesterday, I deadlifted 315 for 4 x 12'
  //                          012345678901234567890123456789012345678
  //                          000000000011111111112222222222333333333

  const entities_405_3x5 = extractor.extract(utterance_405_3x5)
  expect(entities_405_3x5.length).toBe(1)
  const entity_405_3x5 = entities_405_3x5[0]!
  expect(entity_405_3x5.type).toBe('pattern')
  expect(entity_405_3x5.name).toBe(setsAndReps.name)
  expect(entity_405_3x5.confidence).toBe(1)
  expect(entity_405_3x5.value).toBe('3x5')
  expect(entity_405_3x5.source).toBe('3x5')
  expect(entity_405_3x5.charStart).toBe(26)
  expect(entity_405_3x5.charEnd).toBe(29)

  const entities_315_4x12 = extractor.extract(utterance_315_4x12)
  expect(entities_315_4x12.length).toBe(1)
  const entity_315_4x12 = entities_315_4x12[0]!
  expect(entity_315_4x12.type).toBe('pattern')
  expect(entity_315_4x12.name).toBe(setsAndReps.name)
  expect(entity_315_4x12.confidence).toBe(1)
  expect(entity_315_4x12.value).toBe('4 x 12')
  expect(entity_315_4x12.source).toBe('4 x 12')
  expect(entity_315_4x12.charStart).toBe(32)
  expect(entity_315_4x12.charEnd).toBe(38)
})
