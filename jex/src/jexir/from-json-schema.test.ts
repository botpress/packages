import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import { JexIR } from './typings'
import { fromJsonSchema } from './from-json-schema'
import { jsonSchemaBuilder as $ } from '../builders'
import { normalize } from './normalize'

const expectJsonSchema = (jsonSchema: JSONSchema7) => ({
  toEqualJex: async (expectedJexSchema: JexIR): Promise<void> => {
    const actualJexSchema = await fromJsonSchema(jsonSchema)
    const normalizedActual = normalize(actualJexSchema)
    const normalizedExpected = normalize(expectedJexSchema)
    expect(normalizedActual).toEqual(normalizedExpected)
  }
})

test('JexIR should model primitive types', async () => {
  await expectJsonSchema($.string()).toEqualJex({ type: 'string' })
  await expectJsonSchema($.number()).toEqualJex({ type: 'number' })
  await expectJsonSchema($.integer()).toEqualJex({ type: 'number' })
  await expectJsonSchema($.boolean()).toEqualJex({ type: 'boolean' })
  await expectJsonSchema($.null()).toEqualJex({ type: 'null' })
  await expectJsonSchema($.undefined()).toEqualJex({ type: 'undefined' })
})

test('JexIR should model literal types', async () => {
  await expectJsonSchema($.literal('a')).toEqualJex({ type: 'string', value: 'a' })
  await expectJsonSchema($.literal(1)).toEqualJex({ type: 'number', value: 1 })
  await expectJsonSchema($.literal(true)).toEqualJex({ type: 'boolean', value: true })
})

test('JexIR should model union of primitives', async () => {
  await expectJsonSchema($.union([$.string(), $.number()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  await expectJsonSchema($.union([$.boolean(), $.null()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  await expectJsonSchema($.union([$.string(), $.null(), $.undefined()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'undefined' }]
  })
})

test('JexIR should model union of literals of a single primitive', async () => {
  await expectJsonSchema($.union([$.literal('a'), $.literal('b')])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'string', value: 'b' }
    ]
  })
  await expectJsonSchema($.union([$.literal(1), $.literal(2)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'number', value: 1 },
      { type: 'number', value: 2 }
    ]
  })
  await expectJsonSchema($.union([$.literal(true), $.literal(false)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'boolean', value: true },
      { type: 'boolean', value: false }
    ]
  })
})

test('JexIR should model optional and nullable fields', async () => {
  await expectJsonSchema($.optional($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'undefined' }]
  })
  await expectJsonSchema($.nullable($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }]
  })
  await expectJsonSchema($.nullable($.optional($.string()))).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'undefined' }, { type: 'null' }]
  })
})

test('JexIR should model union of literals of multiple primitives', async () => {
  await expectJsonSchema($.union([$.literal('a'), $.literal(1)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'number', value: 1 }
    ]
  })
  await expectJsonSchema(
    $.union([$.literal('yes'), $.literal('no'), $.literal(1), $.literal(0), $.boolean()])
  ).toEqualJex({
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

test('JexIR should model object types', async () => {
  await expectJsonSchema(
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

test('JexIR should model array types', async () => {
  await expectJsonSchema($.array($.string())).toEqualJex({
    type: 'array',
    items: { type: 'string' }
  })
})

test('JexIR should model map types', async () => {
  await expectJsonSchema($.record($.string())).toEqualJex({
    type: 'map',
    items: { type: 'string' }
  })
})

test('JexIR should model unknown type', async () => {
  await expectJsonSchema($.unknown()).toEqualJex({ type: 'unknown' })
})

test('JexIR should model tuple types', async () => {
  await expectJsonSchema($.tuple([$.string(), $.number()])).toEqualJex({
    type: 'tuple',
    items: [{ type: 'string' }, { type: 'number' }]
  })
})
