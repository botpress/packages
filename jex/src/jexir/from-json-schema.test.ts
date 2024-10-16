import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import z from 'zod'
import { JexType } from './typings'

import zodToJsonSchema from 'zod-to-json-schema'
import { fromJsonSchema as j2x } from './from-json-schema'
import { jexBotCreateSchema, zodBotCreateSchema } from './create-bot.utils.test'
import { jexEquals as jexEquals } from '../jex-equals'

const z2j = (s: z.ZodType): JSONSchema7 => zodToJsonSchema(s) as JSONSchema7

const expectZod = (zodSchema: z.ZodType) => ({
  toEqualJex: async (expectedJexSchema: JexType): Promise<void> => {
    const jsonSchema = z2j(zodSchema)
    const actualJexSchema = await j2x(jsonSchema)
    expect(jexEquals(actualJexSchema, expectedJexSchema)).toBe(true)
  }
})

test('jex-rep should model primitive types', async () => {
  await expectZod(z.string()).toEqualJex({ type: 'string' })
  await expectZod(z.number()).toEqualJex({ type: 'number' })
  await expectZod(z.boolean()).toEqualJex({ type: 'boolean' })
  await expectZod(z.null()).toEqualJex({ type: 'null' })
  await expectZod(z.undefined()).toEqualJex({ type: 'undefined' })
})

test('jex-rep should model literal types', async () => {
  await expectZod(z.literal('a')).toEqualJex({ type: 'string', value: 'a' })
  await expectZod(z.literal(1)).toEqualJex({ type: 'number', value: 1 })
  await expectZod(z.literal(true)).toEqualJex({ type: 'boolean', value: true })
})

test('jex-rep should model union of primitives', async () => {
  await expectZod(z.union([z.string(), z.number()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  await expectZod(z.union([z.boolean(), z.null()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  await expectZod(z.union([z.string(), z.null(), z.undefined()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'undefined' }]
  })
})

test('jex-rep should model union of literals of a single primitive', async () => {
  await expectZod(z.union([z.literal('a'), z.literal('b')])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'string', value: 'b' }
    ]
  })
  await expectZod(z.union([z.literal(1), z.literal(2)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'number', value: 1 },
      { type: 'number', value: 2 }
    ]
  })
  await expectZod(z.union([z.literal(true), z.literal(false)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'boolean', value: true },
      { type: 'boolean', value: false }
    ]
  })
})

test('jex-rep should model optional and nullable fields', async () => {
  await expectZod(z.string().optional()).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'undefined' }, { type: 'string' }]
  })
  await expectZod(z.string().nullable()).toEqualJex({ type: 'union', anyOf: [{ type: 'string' }, { type: 'null' }] })
  await expectZod(z.string().optional().nullable()).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'undefined' }, { type: 'string' }, { type: 'null' }]
  })
})

test('jex-rep should model union of literals of multiple primitives', async () => {
  await expectZod(z.union([z.literal('a'), z.literal(1)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'number', value: 1 }
    ]
  })
  await expectZod(z.union([z.literal('yes'), z.literal('no'), z.literal(1), z.literal(0), z.boolean()])).toEqualJex({
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

test('jex-rep should model object types', async () => {
  await expectZod(
    z.object({
      name: z.string(),
      age: z.number()
    })
  ).toEqualJex({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  })
})

test('jex-rep should model array types', async () => {
  await expectZod(z.array(z.string())).toEqualJex({
    type: 'array',
    items: { type: 'string' }
  })
})

test('jex-rep should model map types', async () => {
  await expectZod(z.record(z.string())).toEqualJex({
    type: 'map',
    items: { type: 'string' }
  })
})

test('jex-rep should model any type', async () => {
  await expectZod(z.any()).toEqualJex({ type: 'any' })
})

test('jex-rep should model tuple types', async () => {
  await expectZod(z.tuple([z.string(), z.number()])).toEqualJex({
    type: 'tuple',
    items: [{ type: 'string' }, { type: 'number' }]
  })
})

test('jex-rep should model bot create schema', async () => {
  await expectZod(zodBotCreateSchema).toEqualJex(jexBotCreateSchema)
})
