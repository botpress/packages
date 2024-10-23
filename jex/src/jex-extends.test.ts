import * as jexir from './jexir'
import { JexExtensionResult, jexExtends } from './jex-extends'
import { expect, test } from 'vitest'
import { jexirBuilder as $ } from './builders'

const failureMessage = (res: JexExtensionResult): string => {
  if (res.extends) return ''
  return '\n' + res.reasons.map((r) => ` - ${r}\n`).join('')
}

const successMessage = (typeA: jexir.JexIR, typeB: jexir.JexIR): string => {
  return `${jexir.toString(typeA)} ⊆ ${jexir.toString(typeB)}`
}

const expectJex = (typeA: jexir.JexIR) => ({
  not: {
    toExtend: (typeB: jexir.JexIR) => {
      const normalizedA = jexir.normalize(typeA)
      const normalizedB = jexir.normalize(typeB)
      const actual = jexExtends(normalizedA, normalizedB)
      expect(actual.extends).to.eq(false, successMessage(typeA, typeB))
    }
  },
  toExtend: (typeB: jexir.JexIR) => {
    const normalizedA = jexir.normalize(typeA)
    const normalizedB = jexir.normalize(typeB)
    const actual = jexExtends(normalizedA, normalizedB)
    expect(actual.extends).to.eq(true, failureMessage(actual))
  }
})

// string extends unknown, unknown extends unknown
test('jex-extends should be true if child or parent is unknown', () => {
  expectJex($.unknown()).toExtend($.unknown())
  expectJex($.string()).toExtend($.unknown())
})

// unknown does not extend string
test('jex-extends should be false if child is unknown and parent is not', () => {
  expectJex($.unknown()).not.toExtend($.string())
})

// unknown extends unknown | undefined
test('jex-extends should be true if child is unknown and parent is a union of unknown', () => {
  expectJex($.unknown()).toExtend($.union([$.unknown(), $.undefined()]))
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

// { a: string } extends { a: string; b: string | undefined }
test('jex-extends should be true if child is an object made of only required properties of parent', () => {
  const child = $.object({ a: $.string() })
  const parent = $.object({ a: $.string(), b: $.union([$.string(), $.undefined()]) })
  expectJex(child).toExtend(parent)
})

// string does not extend string | number
test('jex-extends should be true if when child is a union with less types than parent', () => {
  const child = $.union([$.string(), $.number()])
  const parent = $.union([$.string(), $.number(), $.undefined(), $.null()])
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
  expectJex(tupleStrStr).toExtend(arrayStr)

  const tupleStrNum = $.tuple([$.string(), $.number()])
  const arrayStrNum = $.array($.union([$.string(), $.number()]))
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
  expectJex(child).toExtend(parent)
})

// Record<string, string> extends Record<string, string | undefined | boolean>
test('jex-extends should be true if child and parents are maps and child items extends parent items', () => {
  const child = $.map($.string())
  const parent = $.map($.union([$.string(), $.undefined(), $.boolean()]))
  expectJex(child).toExtend(parent)
})

// Record<string, string | undefined | boolean> does not extend Record<string, string>
test('jex-extends should be false if child and parents are maps and child items do not extends parent items', () => {
  const child = $.map($.union([$.string(), $.undefined(), $.boolean()]))
  const parent = $.map($.string())
  expectJex(child).not.toExtend(parent)
})

// Record<string, string> extends { a?: string }
test('jex-extends should be true if child is a map and parent is object with no required properties', () => {
  const child = $.map($.string())
  expectJex(child).toExtend($.object({}))
  expectJex(child).toExtend($.object({ a: $.union([$.string(), $.undefined()]) }))
})

// Record<string, string> does not extend { a: string }
test('jex-extends should be false if child is a map and parent has required properties', () => {
  const child = $.map($.string())
  expectJex(child).not.toExtend($.object({ a: $.string() }))
})

// string & number & boolean extends string & number
test('jex-extends should be true if child is an intersection with more types than parent intersection', () => {
  const a = $.string()
  const b = $.number()
  const c = $.boolean()
  const child = $.intersection([a, b, c])
  const parent = $.intersection([a, b])
  expectJex(child).toExtend(parent)
})

// string & number does not extend string & number & boolean
test('jex-extends should be false if child is an intersection with less types than parent intersection', () => {
  const a = $.string()
  const b = $.number()
  const c = $.boolean()
  const child = $.intersection([a, b])
  const parent = $.intersection([a, b, c])
  expectJex(child).not.toExtend(parent)
})

// string & number extends string
test('jex-extends should be true if child is an intersection that includes the parent', () => {
  const a = $.string()
  const b = $.number()
  const child = $.intersection([a, b])
  const parent = a
  expectJex(child).toExtend(parent)
})

// string does not extend string & number
test('jex-extends should be false if parent is an intersection that includes child', () => {
  const a = $.string()
  const b = $.number()
  const child = a
  const parent = $.intersection([a, b])
  expectJex(child).not.toExtend(parent)
})

// { a: string } extends { a: string } & Record<string, string>
test('jex-extends should be true when child implements all parent intersection', () => {
  const foo = $.object({ a: $.string() })
  const bar = $.map($.string()) // foo is a valid bar
  const child = foo
  const parent = $.intersection([foo, bar])
  expectJex(child).toExtend(parent)
})

test('jex-extends should allow intersection of union to extend union', () => {
  const typeA = $.string()
  const typeB = $.union([$.literal('a'), $.literal('b')])
  const child = $.intersection([typeA, typeB])
  const parent = typeB
  expectJex(child).toExtend(parent)
})
