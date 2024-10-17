import { expect, test } from 'vitest'
import { jexirBuilder as $ } from '../../builders'
import { flattenIntersections } from './flatten-intersections'

test('flattenIntersections should flatten nested intersections to the top level', () => {
  const inputSchema = $.intersection([
    $.string(),
    $.intersection([$.number(), $.intersection([$.boolean(), $.null()])])
  ])
  const expectedSchema = $.intersection([$.string(), $.number(), $.boolean(), $.null()])
  const actualSchema = flattenIntersections(inputSchema)
  expect(actualSchema).toEqual(expectedSchema)
})

test('flattenIntersections should flatten sibling intersections to the top level', () => {
  const inputSchema = $.intersection([
    $.intersection([$.string(), $.number()]),
    $.intersection([$.boolean(), $.null()])
  ])
  const expectedSchema = $.intersection([$.string(), $.number(), $.boolean(), $.null()])
  const actualSchema = flattenIntersections(inputSchema)
  expect(actualSchema).toEqual(expectedSchema)
})
