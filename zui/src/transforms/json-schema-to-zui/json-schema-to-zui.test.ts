import { describe, expect, test } from 'vitest'
import { ZodTypeAny, z } from '../../z'
import { zuiKey } from '../../ui/constants'
import { jsonSchemaToZui, traverseZodDefinitions } from '.'
import { zuiToJsonSchema } from '../zui-to-json-schema/zui-extension'

const testZuiConversion = (zuiObject: ZodTypeAny) => {
  const jsonSchema = zuiToJsonSchema(zuiObject)
  const asZui = jsonSchemaToZui(jsonSchema)
  const convertedJsonSchema = zuiToJsonSchema(asZui)

  expect(jsonSchema).toEqual(convertedJsonSchema)

  const checkZuiProps = (obj: any) => {
    if (obj && typeof obj === 'object') {
      if (obj[zuiKey]) {
        expect(obj[zuiKey]).toBeDefined()
      }
      Object.values(obj).forEach(checkZuiProps)
    }
  }

  checkZuiProps(convertedJsonSchema)

  return convertedJsonSchema
}

describe('jsonSchemaToZui', () => {
  test('convert record', () => {
    const inner = [z.string().title('Name'), z.number().title('Age')] as const

    expect(zuiToJsonSchema(z.record(inner[0], inner[1]))).toMatchObject({
      type: 'object',
      additionalProperties: {
        type: 'number',
        [zuiKey]: {
          title: 'Age',
        },
      },
    })
  })

  test('convert discriminated union', () => {
    const zuiObject = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('a'),
        a: z.string(),
      }),
      z.object({
        type: z.literal('b'),
        b: z.number(),
      }),
    ])
    testZuiConversion(zuiObject)
  })

  test('convert union', () => {
    const zuiObject = z.union([
      z.object({
        type: z.literal('a'),
        a: z.string(),
      }),
      z.object({
        type: z.literal('b'),
        b: z.number(),
      }),
    ])
    testZuiConversion(zuiObject)
  })

  test('convert string with regex', () => {
    const zuiObject = z.string().regex(/hello/i).title('Title').length(20)
    testZuiConversion(zuiObject)
  })

  test('convert complex enum record', () => {
    const complexEnumRecord = z
      .object({
        status: z.enum(['Active', 'Inactive', 'Pending']),
        data: z.record(z.string(), z.union([z.number(), z.boolean()])),
      })
      .describe('Complex enum and record types')
    testZuiConversion(complexEnumRecord)
  })

  test('convert complex enum record', () => {
    const zuiSchema = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])
    const strategy = { discriminator: true, unionStrategy: 'oneOf' } as const

    const jsonSchema = zuiToJsonSchema(zuiSchema, strategy)
    const converted = zuiToJsonSchema(jsonSchemaToZui(jsonSchema), strategy)

    expect(jsonSchema).toEqual(converted)
  })

  test('convert object with nested', () => {
    const zuiSchema = jsonSchemaToZui({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of person', [zuiKey]: { title: 'title' } },
        isAdmin: { type: 'boolean', [zuiKey]: { displayAs: ['Checkbox', {}] } },
        department: { type: 'string', default: 'IT', [zuiKey]: {} },
        address: {
          type: 'object',
          properties: {
            city: {
              type: 'object',
              properties: {
                name: { type: 'string', [zuiKey]: { title: 'City Name' } },
                bestFoods: {
                  type: 'array',
                  items: { type: 'string', [zuiKey]: { title: 'Food Name' } },
                  [zuiKey]: { title: 'Best foods' },
                },
              },
              additionalProperties: false,
              [zuiKey]: {},
            },
            street: { type: 'string', [zuiKey]: { title: 'Street name' } },
          },
          required: ['city'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      required: ['address'],
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
      [zuiKey]: {},
    } as any)

    traverseZodDefinitions(zuiSchema._def, (type, def, path) => {
      if (path.join('.') === 'address.city.bestFoods') {
        expect(['ZodArray', 'ZodOptional']).toContain(type)
        if (type === 'ZodOptional') {
          expect(def[zuiKey]?.title).toBe('Best foods')
        }
      }
      if (path.join('.') === 'address.city.bestFoods.0.type') {
        expect(type).toBe('ZodString')
        expect(def?.[zuiKey]?.title).toBe('Food Name')
      }
    })
  })
})
