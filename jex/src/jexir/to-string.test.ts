import { test, expect } from 'vitest'
import { toString } from './to-string'
import { $ } from '../jex-builder'
import { JexType } from './typings'

const expectJex = (jex: JexType) => ({
  toStringifyAs: (expected: string) => {
    const actual = toString(jex)
    expect(actual).to.eq(expected)
  }
})

test('should correctly convert jex schema to string representation', () => {
  expectJex($.any()).toStringifyAs('any')
  expectJex($.undefined()).toStringifyAs('undefined')
  expectJex($.null()).toStringifyAs('null')
  expectJex($.string()).toStringifyAs('string')
  expectJex($.literal('hello')).toStringifyAs('"hello"')
  expectJex($.number()).toStringifyAs('number')
  expectJex($.literal(42)).toStringifyAs('42')
  expectJex($.boolean()).toStringifyAs('boolean')
  expectJex($.literal(true)).toStringifyAs('true')
  expectJex($.array($.string())).toStringifyAs('string[]')
  expectJex($.tuple([$.string(), $.number()])).toStringifyAs('[string, number]')
  expectJex($.map($.number())).toStringifyAs('{ [key: string]: number }')
  expectJex($.union([$.string(), $.number()])).toStringifyAs('string | number')
  expectJex($.object({ a: $.string(), b: $.number() })).toStringifyAs('{ a: string, b: number }')

  expectJex($.array($.union([$.string(), $.number()]))).toStringifyAs('(string | number)[]')
})
