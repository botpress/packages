import { test, expect } from 'vitest'
import { toString } from './to-string'
import { jexirBuilder as $ } from '../builders/jexir-builder'
import { JexIR } from './typings'

const expectJex = (jex: JexIR) => ({
  toStringifyAs: (expected: string) => {
    const actual = toString(jex)
    expect(actual).to.eq(expected)
  }
})

test('jexir toString should correctly convert jexir schema to string representation', () => {
  expectJex($.unknown()).toStringifyAs('unknown')
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
  expectJex($.intersection([$.string(), $.number()])).toStringifyAs('string & number')
  expectJex($.object({ a: $.string(), b: $.number() })).toStringifyAs('{ a: string, b: number }')
  expectJex($.array($.union([$.string(), $.number()]))).toStringifyAs('(string | number)[]')
})
