import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import z from 'zod'
import { JexType } from './typings'

import zodToJsonSchema from 'zod-to-json-schema'
import { toJex as j2x } from './to-jex'
import { jexBotCreateSchema, zodBotCreateSchema } from './create-bot.utils.test'
import { jexEquals as jexEquals } from './jex-equals'

const z2j = (s: z.ZodType): JSONSchema7 => zodToJsonSchema(s, { $refStrategy: 'none' }) as JSONSchema7 // TODO: support reference

const compareZodAndJex = (zodSchema: z.ZodType, expectedJexSchema: JexType) => {
  const jsonSchema = z2j(zodSchema)
  const actualJexSchema = j2x(jsonSchema)
  expect(jexEquals(actualJexSchema, expectedJexSchema)).toBe(true)
}

test('jex-rep should model primitive types', () => {
  compareZodAndJex(z.string(), { type: 'string' })
  compareZodAndJex(z.number(), { type: 'number' })
  compareZodAndJex(z.boolean(), { type: 'boolean' })
  compareZodAndJex(z.null(), { type: 'null' })
  compareZodAndJex(z.undefined(), { type: 'undefined' })
})

test('jex-rep should model literal types', () => {
  compareZodAndJex(z.literal('a'), { type: 'string', value: 'a' })
  compareZodAndJex(z.literal(1), { type: 'number', value: 1 })
  compareZodAndJex(z.literal(true), { type: 'boolean', value: true })
})

test('jex-rep should model union of primitives', () => {
  compareZodAndJex(z.union([z.string(), z.number()]), {
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  compareZodAndJex(z.union([z.boolean(), z.null()]), {
    type: 'union',
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  compareZodAndJex(z.union([z.string(), z.null(), z.undefined()]), {
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'undefined' }]
  })
})

test('jex-rep should model union of literals of a single primitive', () => {
  compareZodAndJex(z.union([z.literal('a'), z.literal('b')]), {
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'string', value: 'b' }
    ]
  })
  compareZodAndJex(z.union([z.literal(1), z.literal(2)]), {
    type: 'union',
    anyOf: [
      { type: 'number', value: 1 },
      { type: 'number', value: 2 }
    ]
  })
  compareZodAndJex(z.union([z.literal(true), z.literal(false)]), {
    type: 'union',
    anyOf: [
      { type: 'boolean', value: true },
      { type: 'boolean', value: false }
    ]
  })
})

test('jex-rep should model optional and nullable fields', () => {
  compareZodAndJex(z.string().optional(), {
    type: 'union',
    anyOf: [{ type: 'undefined' }, { type: 'string' }]
  })
  compareZodAndJex(z.string().nullable(), {
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }]
  })
  compareZodAndJex(z.string().optional().nullable(), {
    type: 'union',
    anyOf: [{ type: 'undefined' }, { type: 'string' }, { type: 'null' }]
  })
})

test('jex-rep should model union of literals of multiple primitives', () => {
  compareZodAndJex(z.union([z.literal('a'), z.literal(1)]), {
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'number', value: 1 }
    ]
  })

  compareZodAndJex(z.union([z.literal('yes'), z.literal('no'), z.literal(1), z.literal(0), z.boolean()]), {
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

test('jex-rep should model object types', () => {
  compareZodAndJex(
    z.object({
      name: z.string(),
      age: z.number()
    }),
    {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    }
  )
})

test('jex-rep should model array types', () => {
  compareZodAndJex(z.array(z.string()), {
    type: 'array',
    items: { type: 'string' }
  })
})

test('jex-rep should model map types', () => {
  compareZodAndJex(z.record(z.string()), {
    type: 'map',
    items: { type: 'string' }
  })
})

test('jex-rep should model any type', () => {
  compareZodAndJex(z.any(), { type: 'any' })
})

test('jex-rep should model bot create schema', () => {
  compareZodAndJex(zodBotCreateSchema, jexBotCreateSchema)

  // TODO: add update schema with optional fields and nullable fields
  // undefined means that the field should not be updated
  // null means that the field should be deleted
})
