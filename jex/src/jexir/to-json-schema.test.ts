import { toJsonSchema } from './to-json-schema'
import { expect, test } from 'vitest'
import { $ } from '../jex-builder'
import { JexType } from './typings'
import { JSONSchema7 } from 'json-schema'

const expectJex = (jex: JexType) => ({
  toEqualJsonSchema: (expectedJsonSchema: JSONSchema7) => {
    expect(toJsonSchema(jex)).toEqual(expectedJsonSchema)
  }
})

// jex-rep of primitive types should map to json-schema

test('jex-rep of primitive types should map to json-schema', () => {
  expectJex($.string()).toEqualJsonSchema({ type: 'string' })
  expectJex($.number()).toEqualJsonSchema({ type: 'number' })
  expectJex($.boolean()).toEqualJsonSchema({ type: 'boolean' })
  expectJex($.null()).toEqualJsonSchema({ type: 'null' })
  expectJex($.undefined()).toEqualJsonSchema({ not: {} })
})

// jex-rep of literal types should map to json-schema

test('jex-rep of literal types should map to json-schema', () => {
  expectJex($.literal('a')).toEqualJsonSchema({ type: 'string', const: 'a' })
  expectJex($.literal(1)).toEqualJsonSchema({ type: 'number', const: 1 })
  expectJex($.literal(true)).toEqualJsonSchema({ type: 'boolean', const: true })
})

// jex-rep of union of primitives should map to json-schema

test('jex-rep of union of primitives should map to json-schema', () => {
  expectJex($.union([$.string(), $.number()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  expectJex($.union([$.boolean(), $.null()])).toEqualJsonSchema({
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  expectJex($.union([$.string(), $.null(), $.undefined()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'null' }, { not: {} }]
  })
})

// jex-rep of union of literals of a single primitive should map to json-schema

test('jex-rep of union of literals of a single primitive should map to json-schema', () => {
  expectJex($.union([$.literal('a'), $.literal('b')])).toEqualJsonSchema({
    anyOf: [
      { type: 'string', const: 'a' },
      { type: 'string', const: 'b' }
    ]
  })
  expectJex($.union([$.literal(1), $.literal(2)])).toEqualJsonSchema({
    anyOf: [
      { type: 'number', const: 1 },
      { type: 'number', const: 2 }
    ]
  })
})

// jex-rep of optional and nullable fields should map to json-schema

test('jex-rep of optional and nullable fields should map to json-schema', () => {
  expectJex($.union([$.string(), $.undefined()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { not: {} }]
  })
  expectJex($.union([$.string(), $.null()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'null' }]
  })
  expectJex($.union([$.string(), $.null(), $.undefined()])).toEqualJsonSchema({
    anyOf: [{ type: 'string' }, { type: 'null' }, { not: {} }]
  })
})

// jex-rep of union of literals of multiple primitives should map to json-schema

test('jex-rep of union of literals of multiple primitives should map to json-schema', () => {
  expectJex($.union([$.literal('a'), $.literal(1)])).toEqualJsonSchema({
    anyOf: [
      { type: 'string', const: 'a' },
      { type: 'number', const: 1 }
    ]
  })
  expectJex($.union([$.literal('a'), $.literal(1), $.literal(true)])).toEqualJsonSchema({
    anyOf: [
      { type: 'string', const: 'a' },
      { type: 'number', const: 1 },
      { type: 'boolean', const: true }
    ]
  })
})

// jex-rep of object types should map to json-schema

test('jex-rep of object types should map to json-schema', () => {
  expectJex($.object({})).toEqualJsonSchema({ type: 'object', properties: {}, required: [] })
  expectJex($.object({ a: $.string() })).toEqualJsonSchema({
    type: 'object',
    properties: { a: { type: 'string' } },
    required: ['a']
  })
  expectJex($.object({ a: $.string(), b: $.number() })).toEqualJsonSchema({
    type: 'object',
    properties: { a: { type: 'string' }, b: { type: 'number' } },
    required: ['a', 'b']
  })
})

// jex-rep of array types should map to json-schema

test('jex-rep of array types should map to json-schema', () => {
  expectJex($.array($.string())).toEqualJsonSchema({ type: 'array', items: { type: 'string' } })
  expectJex($.array($.number())).toEqualJsonSchema({ type: 'array', items: { type: 'number' } })
  expectJex($.array($.boolean())).toEqualJsonSchema({ type: 'array', items: { type: 'boolean' } })
  expectJex($.array($.null())).toEqualJsonSchema({ type: 'array', items: { type: 'null' } })
  expectJex($.array($.undefined())).toEqualJsonSchema({ type: 'array', items: { not: {} } })
  expectJex($.array($.literal('a'))).toEqualJsonSchema({ type: 'array', items: { type: 'string', const: 'a' } })
})

// jex-rep of map types should map to json-schema

test('jex-rep of map types should map to json-schema', () => {
  expectJex($.map($.string())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'string' } })
  expectJex($.map($.number())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'number' } })
  expectJex($.map($.boolean())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'boolean' } })
  expectJex($.map($.null())).toEqualJsonSchema({ type: 'object', additionalProperties: { type: 'null' } })
  expectJex($.map($.undefined())).toEqualJsonSchema({ type: 'object', additionalProperties: { not: {} } })
  expectJex($.map($.literal('a'))).toEqualJsonSchema({
    type: 'object',
    additionalProperties: { type: 'string', const: 'a' }
  })
})

// jex-rep of any type should map to json-schema

test('jex-rep of any type should map to json-schema', () => {
  expectJex($.any()).toEqualJsonSchema({})
})

// jex-rep of tuple types should map to json-schema

test('jex-rep of tuple types should map to json-schema', () => {
  expectJex($.tuple([$.string(), $.number()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }]
  })
  expectJex($.tuple([$.string(), $.number(), $.boolean()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }]
  })
  expectJex($.tuple([$.string(), $.number(), $.boolean(), $.null()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }]
  })
  expectJex($.tuple([$.string(), $.number(), $.boolean(), $.null(), $.undefined()])).toEqualJsonSchema({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }, { not: {} }]
  })
})
