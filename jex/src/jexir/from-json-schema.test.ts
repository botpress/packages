import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import { JexIR } from './typings'
import { fromJsonSchema } from './from-json-schema'
import { jsonSchemaBuilder as $ } from '../builders'
import { normalize } from './normalize'

const expectJsonSchema = (jsonSchema: JSONSchema7) => ({
  toEqualJex: (expectedJexSchema: JexIR): void => {
    const actualJexSchema = fromJsonSchema(jsonSchema)
    const normalizedActual = normalize(actualJexSchema)
    const normalizedExpected = normalize(expectedJexSchema)
    expect(normalizedActual).toEqual(normalizedExpected)
  }
})

test('JexIR should model primitive types', () => {
  expectJsonSchema($.string()).toEqualJex({ type: 'string' })
  expectJsonSchema($.number()).toEqualJex({ type: 'number' })
  expectJsonSchema($.integer()).toEqualJex({ type: 'number' })
  expectJsonSchema($.boolean()).toEqualJex({ type: 'boolean' })
  expectJsonSchema($.null()).toEqualJex({ type: 'null' })
  expectJsonSchema($.undefined()).toEqualJex({ type: 'undefined' })
})

test('JexIR should model literal types', () => {
  expectJsonSchema($.literal('a')).toEqualJex({ type: 'string', value: 'a' })
  expectJsonSchema($.literal(1)).toEqualJex({ type: 'number', value: 1 })
  expectJsonSchema($.literal(true)).toEqualJex({ type: 'boolean', value: true })
})

test('JexIR should model union of primitives', () => {
  expectJsonSchema($.union([$.string(), $.number()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  expectJsonSchema($.union([$.boolean(), $.null()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  expectJsonSchema($.union([$.string(), $.null(), $.undefined()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'undefined' }]
  })
})

test('JexIR should model union of literals of a single primitive', () => {
  expectJsonSchema($.union([$.literal('a'), $.literal('b')])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'string', value: 'b' }
    ]
  })
  expectJsonSchema($.union([$.literal(1), $.literal(2)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'number', value: 1 },
      { type: 'number', value: 2 }
    ]
  })
  expectJsonSchema($.union([$.literal(true), $.literal(false)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'boolean', value: true },
      { type: 'boolean', value: false }
    ]
  })
})

test('JexIR should model optional and nullable fields', () => {
  expectJsonSchema($.optional($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'undefined' }]
  })
  expectJsonSchema($.nullable($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }]
  })
  expectJsonSchema($.nullable($.optional($.string()))).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'undefined' }, { type: 'null' }]
  })
})

test('JexIR should model union of literals of multiple primitives', () => {
  expectJsonSchema($.union([$.literal('a'), $.literal(1)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'number', value: 1 }
    ]
  })
  expectJsonSchema($.union([$.literal('yes'), $.literal('no'), $.literal(1), $.literal(0), $.boolean()])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'yes' },
      { type: 'string', value: 'no' },
      { type: 'number', value: 1 },
      { type: 'number', value: 0 },
      { type: 'boolean' }
    ]
  })
})

test('JexIR should model object types', () => {
  expectJsonSchema(
    $.object({
      name: $.string(),
      age: $.number()
    })
  ).toEqualJex({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  })
})

test('JexIR should model array types', () => {
  expectJsonSchema($.array($.string())).toEqualJex({
    type: 'array',
    items: { type: 'string' }
  })
})

test('JexIR should model map types', () => {
  expectJsonSchema($.record($.string())).toEqualJex({
    type: 'map',
    items: { type: 'string' }
  })
})

test('JexIR should model unknown type', () => {
  expectJsonSchema($.unknown()).toEqualJex({ type: 'unknown' })
})

test('JexIR should model tuple types', () => {
  expectJsonSchema($.tuple([$.string(), $.number()])).toEqualJex({
    type: 'tuple',
    items: [{ type: 'string' }, { type: 'number' }]
  })
})
