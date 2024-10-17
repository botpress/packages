import * as jexir from './jexir'
import { test, expect } from 'vitest'
import { jexEquals } from './jex-equals'
import { jexirBuilder as $ } from './builders'

const expectJex = (typeA: jexir.JexIR) => ({
  not: {
    toEqual: (typeB: jexir.JexIR) => {
      const normalizedA = jexir.normalize(typeA)
      const normalizedB = jexir.normalize(typeB)
      const actual = jexEquals(normalizedA, normalizedB)
      expect(actual).to.eq(false, `Expected ${jexir.toString(typeA)} not to equal ${jexir.toString(typeB)}`)
    }
  },
  toEqual: (typeB: jexir.JexIR) => {
    const normalizedA = jexir.normalize(typeA)
    const normalizedB = jexir.normalize(typeB)
    const actual = jexEquals(normalizedA, normalizedB)
    expect(actual).to.eq(true, `Expected ${jexir.toString(typeA)} to equal ${jexir.toString(typeB)}`)
  }
})

const stringOrNumber = $.union([$.string(), $.number()])
const numberOrString = $.union([$.number(), $.string()])

test('base type should be equal if they are the same object', () => {
  expectJex($.string()).toEqual($.string())
  expectJex($.number()).toEqual($.number())
  expectJex($.boolean()).toEqual($.boolean())
  expectJex($.null()).toEqual($.null())
  expectJex($.undefined()).toEqual($.undefined())
  expectJex($.unknown()).toEqual($.unknown())
  expectJex($.literal('a')).toEqual($.literal('a'))
  expectJex($.literal(42)).toEqual($.literal(42))
  expectJex($.literal(true)).toEqual($.literal(true))
})

test('base type should not be equal if they are different', () => {
  const a = $.string()
  const b = $.number()
  expectJex(a).not.toEqual(b)
})

test('object should be equal if properties are equal even if order is different', () => {
  const a = $.object({ a: $.string(), b: $.number() })
  const b = $.object({ b: $.number(), a: $.string() })
  expectJex(a).toEqual(b)
})

test('object should not be equal if properties are different', () => {
  const a = $.object({ a: $.string(), b: $.number() })
  const b = $.object({ a: $.string(), b: $.boolean() })
  expectJex(a).not.toEqual(b)
})

test('object should not be equal if properties have different length', () => {
  const a = $.object({ a: $.string(), b: $.number() })
  const b = $.object({ a: $.string(), b: $.number(), c: $.boolean() })
  expectJex(a).not.toEqual(b)
})

test('union should be equal if anyOf are equal even if order is different', () => {
  const a = $.union([$.string(), $.number()])
  const b = $.union([$.number(), $.string()])
  expectJex(a).toEqual(b)
})

test('union should not be equal if anyOf are different', () => {
  const a = $.union([$.string(), $.number()])
  const b = $.union([$.number(), $.boolean()])
  expectJex(a).not.toEqual(b)
})

test('union should not be equal if anyOf have different length', () => {
  const a = $.union([$.string(), $.number()])
  const b = $.union([$.number(), $.number(), $.boolean()])
  expectJex(a).not.toEqual(b)
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
  expectJex(a).toEqual(b)
})

test('arrays should not be equal if items are different', () => {
  const a = $.array(stringOrNumber)
  const b = $.array($.string())
  expectJex(a).not.toEqual(b)
})

test('tuple should be equal if items are equal recursively', () => {
  const a = $.tuple([stringOrNumber, stringOrNumber])
  const b = $.tuple([numberOrString, numberOrString])
  expectJex(a).toEqual(b)
})

test('tuple should not be equal if items are different', () => {
  const a = $.tuple([stringOrNumber, stringOrNumber])
  const b = $.tuple([$.string(), $.string()])
  expectJex(a).not.toEqual(b)
})

test('map should be equal if items are equal recursively', () => {
  const a = $.map(stringOrNumber)
  const b = $.map(numberOrString)
  expectJex(a).toEqual(b)
})

test('map should not be equal if items are different', () => {
  const a = $.map(stringOrNumber)
  const b = $.map($.string())
  expectJex(a).not.toEqual(b)
})
