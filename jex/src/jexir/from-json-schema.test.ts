import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import { JexIR } from './typings'
import { fromJsonSchema as j2x } from './from-json-schema'
import { jexEquals as jexEquals } from '../jex-equals'
import { jsonSchemaBuilder as $ } from '../builders'
import { toString } from './to-string'

const expectZod = (jsonSchema: JSONSchema7) => ({
  toEqualJex: async (expectedJexSchema: JexIR): Promise<void> => {
    const actualJexSchema = await j2x(jsonSchema)

    const expectedStr = toString(expectedJexSchema)
    const actualStr = toString(actualJexSchema)
    const errorMsg = `Expected "${expectedStr}" but got "${actualStr}"`
    expect(jexEquals(actualJexSchema, expectedJexSchema), errorMsg).toBe(true)
  }
})

test('JexIR should model primitive types', async () => {
  await expectZod($.string()).toEqualJex({ type: 'string' })
  await expectZod($.number()).toEqualJex({ type: 'number' })
  await expectZod($.integer()).toEqualJex({ type: 'number' })
  await expectZod($.boolean()).toEqualJex({ type: 'boolean' })
  await expectZod($.null()).toEqualJex({ type: 'null' })
  await expectZod($.undefined()).toEqualJex({ type: 'undefined' })
})

test('JexIR should model literal types', async () => {
  await expectZod($.literal('a')).toEqualJex({ type: 'string', value: 'a' })
  await expectZod($.literal(1)).toEqualJex({ type: 'number', value: 1 })
  await expectZod($.literal(true)).toEqualJex({ type: 'boolean', value: true })
})

test('JexIR should model union of primitives', async () => {
  await expectZod($.union([$.string(), $.number()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  await expectZod($.union([$.boolean(), $.null()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  await expectZod($.union([$.string(), $.null(), $.undefined()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'undefined' }]
  })
})

test('JexIR should model union of literals of a single primitive', async () => {
  await expectZod($.union([$.literal('a'), $.literal('b')])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'string', value: 'b' }
    ]
  })
  await expectZod($.union([$.literal(1), $.literal(2)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'number', value: 1 },
      { type: 'number', value: 2 }
    ]
  })
  await expectZod($.union([$.literal(true), $.literal(false)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'boolean', value: true },
      { type: 'boolean', value: false }
    ]
  })
})

test('JexIR should model optional and nullable fields', async () => {
  await expectZod($.optional($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'undefined' }, { type: 'string' }]
  })
  await expectZod($.nullable($.string())).toEqualJex({ type: 'union', anyOf: [{ type: 'string' }, { type: 'null' }] })
  await expectZod($.nullable($.optional($.string()))).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'undefined' }, { type: 'string' }, { type: 'null' }]
  })
})

test('JexIR should model union of literals of multiple primitives', async () => {
  await expectZod($.union([$.literal('a'), $.literal(1)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'number', value: 1 }
    ]
  })
  await expectZod($.union([$.literal('yes'), $.literal('no'), $.literal(1), $.literal(0), $.boolean()])).toEqualJex({
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
  await expectZod(
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
  await expectZod($.array($.string())).toEqualJex({
    type: 'array',
    items: { type: 'string' }
  })
})

test('JexIR should model map types', async () => {
  await expectZod($.record($.string())).toEqualJex({
    type: 'map',
    items: { type: 'string' }
  })
})

test('JexIR should model unknown type', async () => {
  await expectZod($.unknown()).toEqualJex({ type: 'unknown' })
})

test('JexIR should model tuple types', async () => {
  await expectZod($.tuple([$.string(), $.number()])).toEqualJex({
    type: 'tuple',
    items: [{ type: 'string' }, { type: 'number' }]
  })
})
