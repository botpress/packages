import * as utils from '../utils'
import { JexInfer } from './jex-infer'
import * as types from './typings'
import { jexExtends } from './jex-extends'
import { expect, test } from 'vitest'
import { $ } from './jex-builder'

const expectJex = (jexType: types.JexType) => ({
  not: {
    toExtend: (parent: types.JexType) => {
      const actual = jexExtends(jexType, parent)
      expect(actual).to.eq(false, `${JSON.stringify(jexType)} ⊆ ${JSON.stringify(parent)}`)
    }
  },
  toExtend: (parent: types.JexType) => {
    const actual = jexExtends(jexType, parent)
    expect(actual).to.eq(true, `${JSON.stringify(jexType)} ⊈ ${JSON.stringify(parent)}`)
  }
})

// any extends string, string extends any, any extends any
test('jex-extends should be true if child or parent is any', () => {
  expectJex($.any()).toExtend($.any())
  expectJex($.string()).toExtend($.any())
  expectJex($.any()).toExtend($.string())
})

// string extends string, { a: string } extends { a: string }, etc..
test('jex-extends should be true if child and parent are the same', () => {
  expectJex($.string()).toExtend($.string())
  expectJex($.number()).toExtend($.number())
  expectJex($.boolean()).toExtend($.boolean())
  expectJex($.null()).toExtend($.null())
  expectJex($.undefined()).toExtend($.undefined())
  expectJex($.object({ a: $.string() })).toExtend($.object({ a: $.string() }))
  expectJex($.union([$.string(), $.number()])).toExtend($.union([$.string(), $.number()]))
})

// { a: string, b: number } extends { a: string }
test('jex-extends should be true if child is an object with more properties than parent', () => {
  const child = $.object({ a: $.string(), b: $.number() })
  const parent = $.object({ a: $.string() })
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// { a: string } does not extend { a: string, b: number }
test('jex-extends should be false if child is an object with less properties than parent', () => {
  const child = $.object({ a: $.string() })
  const parent = $.object({ a: $.string(), b: $.number() })
  expectJex(child).not.toExtend(parent)
})

// { a: string | undefined } does not extend { a: string }
test('jex-extends should be false if an optional property of child is required in parent', () => {
  const child = $.object({ a: $.union([$.string(), $.undefined()]) })
  const parent = $.object({ a: $.string() })
  expectJex(child).not.toExtend(parent)
})

// string does not extend string | number
test('jex-extends should be true if when child is a union with less types than parent', () => {
  const child = $.union([$.string(), $.number()])
  const parent = $.union([$.string(), $.number(), $.undefined(), $.null()])
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// string | number does not extends string
test('jex-extends should be false if child is a union with more types than parent', () => {
  const child = $.union([$.string(), $.number(), $.undefined(), $.null()])
  const parent = $.union([$.string(), $.number()])
  expectJex(child).not.toExtend(parent)
})

// "banana" extends string
test('jex-extends should be true if child is a literal with same base type than parent', () => {
  const child = $.literal('banana')
  const parent = $.union([$.string(), $.number()])
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// string does not extend "banana"
test('jex-extends should be false if child is a primitive and parent is a literal', () => {
  const child = $.string()
  const parent = $.literal('banana')
  expectJex(child).not.toExtend(parent)
})

// "banana" extends string | "apple" | number
test('jex-extends should be true if child is a literal included in parent union', () => {
  const child = $.literal('banana')
  const parent = $.union([$.string(), $.number(), $.literal('banana')])
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// "banana" does not extend "apple" | number
test('jex-extends should be false if child is a literal not included in parent union', () => {
  const child = $.literal('banana')
  const parent = $.union([$.number(), $.literal('apple')])
  expectJex(child).not.toExtend(parent)
})

// { a: string }[] extends { a: string | null }[]
test('jex-extends should be true if child and parents are arrays and child items extends parent items', () => {
  const child = $.array($.string())
  const parent = $.array($.union([$.string(), $.undefined()]))
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// { a: string }[] does not extend { a: number }[]
test('jex-extends should be false if child and parents are arrays and child items do not extends parent items', () => {
  const child = $.array($.string())
  const parent = $.array($.number())
  expectJex(child).not.toExtend(parent)
})

// [string, string] extends string[], [string, number] extends (string | number)[]
test('jex-extends should be true if child is a tuple and parent is an array with the same items', () => {
  const tupleStrStr = $.tuple([$.string(), $.string()])
  const arrayStr = $.array($.string())
  type _childExtendsParent1 = utils.types.Expect<
    utils.types.Extends<JexInfer<typeof tupleStrStr>, JexInfer<typeof arrayStr>>
  >
  expectJex(tupleStrStr).toExtend(arrayStr)

  const tupleStrNum = $.tuple([$.string(), $.number()])
  const arrayStrNum = $.array($.union([$.string(), $.number()]))
  type _childExtendsParent2 = utils.types.Expect<
    utils.types.Extends<JexInfer<typeof tupleStrNum>, JexInfer<typeof arrayStrNum>>
  >
  expectJex(tupleStrNum).toExtend(arrayStrNum)
})

// [string, string] does not extend number[]
test('jex-extends should be false if child is a tuple and parent is an array with different items', () => {
  const child = $.tuple([$.string(), $.number()])
  const parent = $.array($.number())
  expectJex(child).not.toExtend(parent)
})

// { a: string } extends { a: string | number }
test('jex-extends should be true if child and parent are objects and child items extends parent items', () => {
  const child = $.object({ a: $.string() })
  const parent = $.object({ a: $.union([$.string(), $.number()]) })
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// Record<string, string> extends Record<string, string | undefined | boolean>
test('jex-extends should be true if child and parents are maps and child items extends parent items', () => {
  const child = $.map($.string())
  const parent = $.map($.union([$.string(), $.undefined(), $.boolean()]))
  type _child = JexInfer<typeof child>
  type _parent = JexInfer<typeof parent>
  type _childExtendsParent = utils.types.Expect<utils.types.Extends<_child, _parent>>
  expectJex(child).toExtend(parent)
})

// Record<string, string | undefined | boolean> does not extend Record<string, string>
test('jex-extends should be false if child and parents are maps and child items do not extends parent items', () => {
  const child = $.map($.union([$.string(), $.undefined(), $.boolean()]))
  const parent = $.map($.string())
  expectJex(child).not.toExtend(parent)
})
