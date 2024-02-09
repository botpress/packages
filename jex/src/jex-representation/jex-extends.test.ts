import * as types from './typings'
import { jexExtends } from './jex-extends'
import { expect, test } from 'vitest'

const expectJex = (jexType: types.JexType) => ({
  not: {
    toExtend: (parent: types.JexType) => {
      const actual = jexExtends(jexType, parent)
      expect(actual).toBe(false)
    }
  },
  toExtend: (parent: types.JexType) => {
    const actual = jexExtends(jexType, parent)
    expect(actual).toBe(true)
  }
})

type TypeOf<T extends string | number | boolean> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : never

type TupleOf<T extends any> =
  | [T, T]
  | [T, T, T]
  | [T, T, T, T]
  | [T, T, T, T, T]
  | [T, T, T, T, T, T]
  | [T, T, T, T, T, T, T]
  | [T, T, T, T, T, T, T, T] // this is enough for the test

type jex = typeof jex
const jex = {
  any: () => ({ type: 'any' }) satisfies types.JexType,
  string: () => ({ type: 'string' }) satisfies types.JexType,
  number: () => ({ type: 'number' }) satisfies types.JexType,
  boolean: () => ({ type: 'boolean' }) satisfies types.JexType,
  null: () => ({ type: 'null' }) satisfies types.JexType,
  undefined: () => ({ type: 'undefined' }) satisfies types.JexType,
  literal: <T extends string | number | boolean>(value: T): types.JexType => ({
    type: typeof value as TypeOf<T>,
    value
  }),
  object: (properties: Record<string, types.JexType>) => ({ type: 'object', properties }) satisfies types.JexType,
  array: (items: types.JexType): types.JexType => ({ type: 'array', items }),
  map: (items: types.JexType): types.JexType => ({ type: 'map', items }),
  tuple: (items: types.JexType[]): types.JexType => ({ type: 'tuple', items }),
  union: (anyOf: TupleOf<types.JexType>): types.JexType => ({ type: 'union', anyOf })
}

// any extends string, string extends any, any extends any
test('jex-extends should be true if child or parent is any', () => {
  expectJex(jex.any()).toExtend(jex.any())
  expectJex(jex.string()).toExtend(jex.any())
  expectJex(jex.any()).toExtend(jex.string())
})

// string extends string, { a: string } extends { a: string }, etc..
test('jex-extends should be true if child and parent are the same', () => {
  expectJex(jex.string()).toExtend(jex.string())
  expectJex(jex.number()).toExtend(jex.number())
  expectJex(jex.boolean()).toExtend(jex.boolean())
  expectJex(jex.null()).toExtend(jex.null())
  expectJex(jex.undefined()).toExtend(jex.undefined())
  expectJex(jex.object({ a: jex.string() })).toExtend(jex.object({ a: jex.string() }))
  expectJex(jex.union([jex.string(), jex.number()])).toExtend(jex.union([jex.string(), jex.number()]))
})

// { a: string, b: number } extends { a: string }
test('jex-extends should be true if child is an object with more properties than parent', () => {
  const child = jex.object({ a: jex.string(), b: jex.number() })
  const parent = jex.object({ a: jex.string() })
  expectJex(child).toExtend(parent)
})

// { a: string } does not extend { a: string, b: number }
test('jex-extends should be false if child is an object with less properties than parent', () => {
  const child = jex.object({ a: jex.string() })
  const parent = jex.object({ a: jex.string(), b: jex.number() })
  expectJex(child).not.toExtend(parent)
})

// { a: string | undefined } does not extend { a: string }
test('jex-extends should be false if an optional property of child is required in parent', () => {
  const child = jex.object({ a: jex.union([jex.string(), jex.undefined()]) })
  const parent = jex.object({ a: jex.string() })
  expectJex(child).not.toExtend(parent)
})

// string does not extend string | number
test('jex-extends should be true if when child is a union with less types than parent', () => {
  const child = jex.union([jex.string(), jex.number()])
  const parent = jex.union([jex.string(), jex.number(), jex.undefined(), jex.null()])
  expectJex(child).toExtend(parent)
})

// string | number does not extends string
test('jex-extends should be false if child is a union with more types than parent', () => {
  const child = jex.union([jex.string(), jex.number(), jex.undefined(), jex.null()])
  const parent = jex.union([jex.string(), jex.number()])
  expectJex(child).not.toExtend(parent)
})

// "banana" extends string
test('jex-extends should be true if child is a literal with same base type than parent', () => {
  const child = jex.literal('banana')
  const parent = jex.union([jex.string(), jex.number()])
  expectJex(child).toExtend(parent)
})

// string does not extend "banana"
test('jex-extends should be false if child is a primitive and parent is a literal', () => {
  const child = jex.string()
  const parent = jex.literal('banana')
  expectJex(child).not.toExtend(parent)
})

// "banana" extends string | "apple" | number
test('jex-extends should be true if child is a literal included in parent union', () => {
  const child = jex.literal('banana')
  const parent = jex.union([jex.string(), jex.number(), jex.literal('banana')])
  expectJex(child).toExtend(parent)
})

// "banana" does not extend "apple" | number
test('jex-extends should be false if child is a literal not included in parent union', () => {
  const child = jex.literal('banana')
  const parent = jex.union([jex.number(), jex.literal('apple')])
  expectJex(child).not.toExtend(parent)
})

// { a: string }[] extends { a: string | null }[]
test('jex-extends should be true if child and parents are arrays and child items extends parent items', () => {
  const child = jex.array(jex.string())
  const parent = jex.array(jex.union([jex.string(), jex.undefined()]))
  expectJex(child).toExtend(parent)
})

// { a: string }[] does not extend { a: number }[]
test('jex-extends should be false if child and parents are arrays and child items do not extends parent items', () => {
  const child = jex.array(jex.string())
  const parent = jex.array(jex.number())
  expectJex(child).not.toExtend(parent)
})

// [string, string] extends string[], [string, number] extends 🔥 (string | number)[]
test('jex-extends should be true if child is a tuple and parent is an array with the same items', () => {
  const tupleStrStr = jex.tuple([jex.string(), jex.string()])
  const arrayStr = jex.array(jex.string())
  expectJex(tupleStrStr).toExtend(arrayStr)

  const tupleStrNum = jex.tuple([jex.string(), jex.number()])
  const arrayStrNum = jex.array(jex.union([jex.string(), jex.number()]))
  expectJex(tupleStrNum).toExtend(arrayStrNum)
})

// [string, string] does not extend number[]
test('jex-extends should be false if child is a tuple and parent is an array with different items', () => {
  const child = jex.tuple([jex.string(), jex.number()])
  const parent = jex.array(jex.number())
  expectJex(child).not.toExtend(parent)
})

// { a: string } extends { a: string | number }
test('jex-extends should be true if child and parent are objects and child items extends parent items', () => {
  const child = jex.object({ a: jex.string() })
  const parent = jex.object({ a: jex.union([jex.string(), jex.number()]) })
  expectJex(child).toExtend(parent)
})

// Record<string, string> extends Record<string, string | undefined | boolean>
test('jex-extends should be true if child and parents are maps and child items extends parent items', () => {
  const child = jex.map(jex.string())
  const parent = jex.map(jex.union([jex.string(), jex.undefined(), jex.boolean()]))
  expectJex(child).toExtend(parent)
})

// Record<string, string | undefined | boolean> does not extend Record<string, string>
test('jex-extends should be false if child and parents are maps and child items do not extends parent items', () => {
  const child = jex.map(jex.union([jex.string(), jex.undefined(), jex.boolean()]))
  const parent = jex.map(jex.string())
  expectJex(child).not.toExtend(parent)
})
