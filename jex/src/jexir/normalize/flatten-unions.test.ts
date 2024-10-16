import { expect, test } from 'vitest'
import { jexirBuilder as $ } from '../../builders'
import { flattenUnions } from './flatten-unions'

test('flattenUnions should flatten nested unions to the top level', () => {
  const inputSchema = $.union([$.string(), $.union([$.number(), $.union([$.boolean(), $.null()])])])
  const expectedSchema = $.union([$.string(), $.number(), $.boolean(), $.null()])
  const actualSchema = flattenUnions(inputSchema)
  expect(actualSchema).toEqual(expectedSchema)
})

test('flattenUnions should flatten sibling unions to the top level', () => {
  const inputSchema = $.union([$.union([$.string(), $.number()]), $.union([$.boolean(), $.null()])])
  const expectedSchema = $.union([$.string(), $.number(), $.boolean(), $.null()])
  const actualSchema = flattenUnions(inputSchema)
  expect(actualSchema).toEqual(expectedSchema)
})
