import { test, expect } from 'vitest'
import { PropertyPath, PropertyPathSection, pathToString } from './property-path'

const keyA: PropertyPathSection = { type: 'key', value: 'a' }
const keyB: PropertyPathSection = { type: 'key', value: 'b' }
const stringIndexBanana: PropertyPathSection = { type: 'string-index', value: 'banana' }
const numberIndex0: PropertyPathSection = { type: 'number-index', value: 0 }
const numberIndex: PropertyPathSection = { type: 'number-index' }
const stringIndex: PropertyPathSection = { type: 'string-index' }

const expectPath = (path: PropertyPath) => ({
  toEqual: (expected: string) => {
    const actual = pathToString(path)
    expect(actual).to.eq(expected)
  }
})

test('property path should correctly indicate which property is targeted', () => {
  expectPath([]).toEqual('#')
  expectPath([keyA]).toEqual('#.a')
  expectPath([keyA, keyB]).toEqual('#.a.b')
  expectPath([keyA, keyB, stringIndexBanana]).toEqual('#.a.b["banana"]')
  expectPath([keyA, keyB, numberIndex0]).toEqual('#.a.b[0]')
  expectPath([keyA, keyB, numberIndex]).toEqual('#.a.b[number]')
  expectPath([keyA, keyB, stringIndex]).toEqual('#.a.b[string]')
})
