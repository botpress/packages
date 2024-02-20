import { fromJex } from './from-jex'
import { expect, test } from 'vitest'
import { $ } from './jex-builder'
import { JexType } from './typings'
import { JSONSchema7 } from 'json-schema'
import { toJex } from './to-jex'

const expectJex = (actualJex: JexType) => ({
  toEqualJsonSchema: async (expectedJsonSchema: JSONSchema7) => {
    const actualJsonSchema = fromJex(actualJex)
    expect(actualJsonSchema).toEqual(expectedJsonSchema)

    const expectedJex = await toJex(expectedJsonSchema)
    expect(actualJex).toEqual(expectedJex)
  }
})

test('jex-rep of primitive types should map to json-schema', async () => {
  await expectJex($.string()).toEqualJsonSchema({ type: 'string' })
  await expectJex($.number()).toEqualJsonSchema({ type: 'number' })
  await expectJex($.boolean()).toEqualJsonSchema({ type: 'boolean' })
  await expectJex($.null()).toEqualJsonSchema({ type: 'null' })
  await expectJex($.undefined()).toEqualJsonSchema({ not: {} })
})

test('jex-rep of literal types should map to json-schema', async () => {
  await expectJex($.literal('a')).toEqualJsonSchema({ type: 'string', const: 'a' })
  await expectJex($.literal(1)).toEqualJsonSchema({ type: 'number', const: 1 })
  await expectJex($.literal(true)).toEqualJsonSchema({ type: 'boolean', const: true })
})

test('jex-rep of union of primitives should map to json-schema', async () => {
  await expectJex($.union([$.string(), $.number()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  await expectJex($.union([$.boolean(), $.null()])).toEqualJsonSchema({
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  await expectJex($.union([$.string(), $.null(), $.undefined()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'null' }, { not: {} }]
  })
})

test('jex-rep of union of literals of a single primitive should map to json-schema', async () => {
  await expectJex($.union([$.literal('a'), $.literal('b')])).toEqualJsonSchema({
    anyOf: [
      { type: 'string', const: 'a' },
      { type: 'string', const: 'b' }
    ]
  })
  await expectJex($.union([$.literal(1), $.literal(2)])).toEqualJsonSchema({
    anyOf: [
      { type: 'number', const: 1 },
      { type: 'number', const: 2 }
    ]
  })
})

test('jex-rep of optional and nullable fields should map to json-schema', async () => {
  await expectJex($.union([$.string(), $.undefined()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { not: {} }]
  })
  await expectJex($.union([$.string(), $.null()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'null' }]
  })
  await expectJex($.union([$.string(), $.null(), $.undefined()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'null' }, { not: {} }]
  })
})

test('jex-rep of union of literals of multiple primitives should map to json-schema', async () => {
  await expectJex($.union([$.literal('a'), $.literal(1)])).toEqualJsonSchema({
    anyOf: [
      { type: 'string', const: 'a' },
      { type: 'number', const: 1 }
    ]
  })
  await expectJex($.union([$.literal('a'), $.literal(1), $.literal(true)])).toEqualJsonSchema({
    anyOf: [
      { type: 'string', const: 'a' },
      { type: 'number', const: 1 },
      { type: 'boolean', const: true }
    ]
  })
})

test('jex-rep of object types should map to json-schema', async () => {
  await expectJex($.object({})).toEqualJsonSchema({ type: 'object', properties: {}, required: [] })
  await expectJex($.object({ a: $.string() })).toEqualJsonSchema({
    type: 'object',
    properties: { a: { type: 'string' } },
    required: ['a']
  })
  await expectJex($.object({ a: $.string(), b: $.number() })).toEqualJsonSchema({
    type: 'object',
    properties: { a: { type: 'string' }, b: { type: 'number' } },
    required: ['a', 'b']
  })
})

test('jex-rep of array types should map to json-schema', async () => {
  await expectJex($.array($.string())).toEqualJsonSchema({ type: 'array', items: { type: 'string' } })
  await expectJex($.array($.number())).toEqualJsonSchema({ type: 'array', items: { type: 'number' } })
  await expectJex($.array($.boolean())).toEqualJsonSchema({ type: 'array', items: { type: 'boolean' } })
  await expectJex($.array($.null())).toEqualJsonSchema({ type: 'array', items: { type: 'null' } })
  await expectJex($.array($.undefined())).toEqualJsonSchema({ type: 'array', items: { not: {} } })
  await expectJex($.array($.literal('a'))).toEqualJsonSchema({ type: 'array', items: { type: 'string', const: 'a' } })
})

test('jex-rep of map types should map to json-schema', async () => {
  await expectJex($.map($.string())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'string' } })
  await expectJex($.map($.number())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'number' } })
  await expectJex($.map($.boolean())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'boolean' } })
  await expectJex($.map($.null())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'null' } })
  await expectJex($.map($.undefined())).toEqualJsonSchema({ type: 'object', additionalProperties: { not: {} } })
  await expectJex($.map($.literal('a'))).toEqualJsonSchema({
    type: 'object',
    additionalProperties: { type: 'string', const: 'a' }
  })
})

test('jex-rep of any type should map to json-schema', async () => {
  await expectJex($.any()).toEqualJsonSchema({})
})

test('jex-rep of tuple types should map to json-schema', async () => {
  await expectJex($.tuple([$.string(), $.number()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }]
  })
  await expectJex($.tuple([$.string(), $.number(), $.boolean()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }]
  })
  await expectJex($.tuple([$.string(), $.number(), $.boolean(), $.null()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }]
  })
  await expectJex($.tuple([$.string(), $.number(), $.boolean(), $.null(), $.undefined()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }, { not: {} }]
  })
})
