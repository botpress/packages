import { expect, test } from 'vitest'
import { jexirBuilder as $ } from '../../builders'
import { applyIntersections } from './apply-intersections'

test('applyIntersections should merge objects with no common keys into a single object', () => {
  const foo = $.object({ a: $.string() })
  const bar = $.object({ b: $.number() })
  const baz = $.object({ c: $.boolean() })
  const schema = $.intersection([foo, bar, baz])
  const expectedSchema = $.object({ ...foo.properties, ...bar.properties, ...baz.properties })
  const actualSchema = applyIntersections(schema)
  expect(actualSchema).toEqual(expectedSchema)
})

test('applyIntersections remain an intersection if some children are not objects', () => {
  const foo = $.object({ a: $.string() })
  const bar = $.object({ b: $.number() })
  const baz = $.map($.boolean())
  const schema = $.intersection([foo, bar, baz])
  const expectedSchema = $.intersection([$.object({ ...foo.properties, ...bar.properties }), baz])
  const actualSchema = applyIntersections(schema)
  expect(actualSchema).toEqual(expectedSchema)
})

test('applyIntersections should deep merge objects with common keys', () => {
  const foo = $.object({ a: $.string(), c: $.object({ d: $.undefined() }) })
  const bar = $.object({ b: $.number(), c: $.object({ e: $.null() }) })
  const schema = $.intersection([foo, bar])
  const expectedSchema = $.object({
    a: $.string(),
    b: $.number(),
    c: $.object({ d: $.undefined(), e: $.null() })
  })
  const actualSchema = applyIntersections(schema)
  expect(actualSchema).toEqual(expectedSchema)
})

test('applyIntersections should deep merge objects with common keys even if some children are not objects', () => {
  const banana = $.tuple([$.literal('banana')])
  const foo = $.object({ a: $.string(), c: $.object({ d: $.undefined() }) })
  const bar = $.object({
    b: $.number(),
    c: $.intersection([$.object({ e: $.null() }), banana])
  })
  const baz = $.map($.boolean())
  const schema = $.intersection([foo, bar, baz])
  const expectedSchema = $.intersection([
    $.object({
      a: $.string(),
      c: $.intersection([
        //
        $.object({ d: $.undefined(), e: $.null() }),
        banana
      ]),
      b: $.number()
    }),
    baz
  ])
  const actualSchema = applyIntersections(schema)
  expect(actualSchema).toEqual(expectedSchema)
})
