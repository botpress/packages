import { test, expect } from 'vitest'
import { jexEquals } from './jex-equals'
import { jexirBuilder as $ } from './builders'

const stringOrNumber = $.union([$.string(), $.number()])
const numberOrString = $.union([$.number(), $.string()])

test('base type should be equal if they are the same object', () => {
  expect(jexEquals($.string(), $.string())).toBe(true)
  expect(jexEquals($.number(), $.number())).toBe(true)
  expect(jexEquals($.boolean(), $.boolean())).toBe(true)
  expect(jexEquals($.null(), $.null())).toBe(true)
  expect(jexEquals($.undefined(), $.undefined())).toBe(true)
  expect(jexEquals($.unknown(), $.unknown())).toBe(true)
  expect(jexEquals($.literal('a'), $.literal('a'))).toBe(true)
  expect(jexEquals($.literal(42), $.literal(42))).toBe(true)
  expect(jexEquals($.literal(true), $.literal(true))).toBe(true)
})

test('base type should not be equal if they are different', () => {
  const a = $.string()
  const b = $.number()
  expect(jexEquals(a, b)).toBe(false)
})

test('object should be equal if properties are equal even if order is different', () => {
  const a = $.object({ a: $.string(), b: $.number() })
  const b = $.object({ b: $.number(), a: $.string() })
  expect(jexEquals(a, b)).toBe(true)
})

test('object should not be equal if properties are different', () => {
  const a = $.object({ a: $.string(), b: $.number() })
  const b = $.object({ a: $.string(), b: $.boolean() })
  expect(jexEquals(a, b)).toBe(false)
})

test('object should not be equal if properties have different length', () => {
  const a = $.object({ a: $.string(), b: $.number() })
  const b = $.object({ a: $.string(), b: $.number(), c: $.boolean() })
  expect(jexEquals(a, b)).toBe(false)
})

test('union should be equal if anyOf are equal even if order is different', () => {
  const a = $.union([$.string(), $.number()])
  const b = $.union([$.number(), $.string()])
  expect(jexEquals(a, b)).toBe(true)
})

test('union should not be equal if anyOf are different', () => {
  const a = $.union([$.string(), $.number()])
  const b = $.union([$.number(), $.boolean()])
  expect(jexEquals(a, b)).toBe(false)
})

test('union should not be equal if anyOf have different length', () => {
  const a = $.union([$.string(), $.number()])
  const b = $.union([$.number(), $.number(), $.boolean()])
  expect(jexEquals(a, b)).toBe(false)
})

test('intersection should be equal if allOf are equal even if order is different', () => {
  const a = $.intersection([$.string(), $.number()])
  const b = $.intersection([$.number(), $.string()])
  expect(jexEquals(a, b)).toBe(true)
})

test('intersection should not be equal if allOf are different', () => {
  const a = $.intersection([$.string(), $.number()])
  const b = $.intersection([$.number(), $.boolean()])
  expect(jexEquals(a, b)).toBe(false)
})

test('intersection should not be equal if allOf have different length', () => {
  const a = $.intersection([$.string(), $.number()])
  const b = $.intersection([$.number(), $.number(), $.boolean()])
  expect(jexEquals(a, b)).toBe(false)
})

test('arrays should be equal if items are equal recursively', () => {
  const a = $.array(stringOrNumber)
  const b = $.array(numberOrString)
  expect(jexEquals(a, b)).toBe(true)
})

test('arrays should not be equal if items are different', () => {
  const a = $.array(stringOrNumber)
  const b = $.array($.string())
  expect(jexEquals(a, b)).toBe(false)
})

test('tuple should be equal if items are equal recursively', () => {
  const a = $.tuple([stringOrNumber, stringOrNumber])
  const b = $.tuple([numberOrString, numberOrString])
  expect(jexEquals(a, b)).toBe(true)
})

test('tuple should not be equal if items are different', () => {
  const a = $.tuple([stringOrNumber, stringOrNumber])
  const b = $.tuple([$.string(), $.string()])
  expect(jexEquals(a, b)).toBe(false)
})

test('map should be equal if items are equal recursively', () => {
  const a = $.map(stringOrNumber)
  const b = $.map(numberOrString)
  expect(jexEquals(a, b)).toBe(true)
})

test('map should not be equal if items are different', () => {
  const a = $.map(stringOrNumber)
  const b = $.map($.string())
  expect(jexEquals(a, b)).toBe(false)
})
