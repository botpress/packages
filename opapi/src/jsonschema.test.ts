import { JSONSchema7 } from 'json-schema'
import { describe, it, test, expect } from 'vitest'
import { z } from 'zod'
import {
  generateSchemaFromZod,
  JsonSchema,
  NullableJsonSchema,
  replaceNullableWithUnion,
  replaceOneOfWithAnyOf,
  setDefaultAdditionalProperties,
} from './jsonschema'
import { jsonSchemaBuilder, JsonSchemaBuilder } from './handler-generator/utils'
import _ from 'lodash'

test('replaceNullableWithUnion', () => {
  const invalidBuilder = {
    ...jsonSchemaBuilder,
    nullable: (s: JSONSchema7): JSONSchema7 => ({ ...s, nullable: true }) as JSONSchema7,
  } as JsonSchemaBuilder

  const validBuilder: JsonSchemaBuilder = jsonSchemaBuilder

  const buildSchemas = (s: JsonSchemaBuilder) => {
    const nullableString = s.nullable(s.string())
    return [
      // string
      s.string(),
      // string | null
      nullableString,
      // { a: string | null }
      s.object({ a: nullableString }),
      // { [key: string]: string | null }
      s.record(nullableString),
      // { a: { b: string | null } | null }
      s.object({ a: s.nullable(s.object({ b: nullableString })) }),
      // { [key: string]: { b: string | null } | null }
      s.record(s.nullable(s.object({ b: nullableString }))),
      // { [key: string]: { [key: string]: string | null } | null }
      s.record(s.nullable(s.record(nullableString))),
      // (string | null)[]
      s.array(nullableString),
      // ({ a: string | null } | null)[]
      s.array(s.nullable(s.object({ a: nullableString }))),
      // [string, string | null]
      s.tuple([s.string(), nullableString]),
      // [string, { a: string | null } | null]
      s.tuple([s.string(), s.nullable(s.object({ a: nullableString }))]),
    ]
  }

  const inputSchemas = buildSchemas(invalidBuilder)
  const expectedSchemas = buildSchemas(validBuilder)

  for (let i = 0; i < inputSchemas.length; i++) {
    const inputSchema = inputSchemas[i]
    const expectedSchema = expectedSchemas[i]
    const actualSchema = replaceNullableWithUnion(inputSchema as NullableJsonSchema)
    expect(actualSchema).toEqual(expectedSchema)
  }
})

test('setDefaultAdditionalProperties', () => {
  const defaultAdditionalProperties = false

  const builderWithoutDefaults: JsonSchemaBuilder = jsonSchemaBuilder
  const builderWithDefaults: JsonSchemaBuilder = {
    ...jsonSchemaBuilder,
    object: (...args) => ({
      ...builderWithoutDefaults.object(...args),
      additionalProperties: defaultAdditionalProperties,
    }),
  }

  const buildSchemas = (s: JsonSchemaBuilder) => {
    return [
      // string
      s.string(),
      // { a: string }
      s.object({ a: s.string() }),
      // { [key: string]: string }
      s.record(s.string()),
      // { a: { b: string } }
      s.object({ a: s.object({ b: s.string() }) }),
      // { [key: string]: { b: string } }
      s.record(s.object({ b: s.string() })),
      // { [key: string]: { [key: string]: string } }
      s.record(s.record(s.string())),
      // (string)[]
      s.array(s.string()),
      // ({ a: string })[]
      s.array(s.object({ a: s.string() })),
      // { [key: string]: string }[]
      s.array(s.record(s.string())),
      // { a: { b: string } }[]
      s.array(s.object({ a: s.object({ b: s.string() }) })),
      // { [key: string]: { b: string } }[]
      s.array(s.record(s.object({ b: s.string() }))),
      // { [key: string]: { [key: string]: string } }[]
      s.array(s.record(s.record(s.string()))),
      // [number, string]
      s.tuple([s.number(), s.string()]),
      // [number, ({ a: string })]
      s.tuple([s.number(), s.object({ a: s.string() })]),
      // [number, { [key: string]: string }]
      s.tuple([s.number(), s.record(s.string())]),
      // [number, { a: { b: string } }]
      s.tuple([s.number(), s.object({ a: s.object({ b: s.string() }) })]),
      // [number, { [key: string]: { b: string } }]
      s.tuple([s.number(), s.record(s.object({ b: s.string() }))]),
      // [number, { [key: string]: { [key: string]: string } }]
      s.tuple([s.number(), s.record(s.record(s.string()))]),
    ]
  }

  const inputSchemas = buildSchemas(builderWithoutDefaults)
  const expectedSchemas = buildSchemas(builderWithDefaults)

  for (let i = 0; i < inputSchemas.length; i++) {
    const inputSchema = inputSchemas[i] as JsonSchema
    const expectedSchema = expectedSchemas[i]
    const actual = setDefaultAdditionalProperties(inputSchema, defaultAdditionalProperties)
    expect(actual).toEqual(expectedSchema)
  }
})

test('setDefaultAdditionalProperties with real example', () => {
  const input: JsonSchema = {
    type: 'object',
    properties: {
      pats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            note: {
              type: 'string',
            },
          },
          required: ['id', 'createdAt', 'note'],
        },
      },
    },
    required: ['pats'],
    title: 'listPersonalAccessTokensResponse',
    additionalProperties: false,
  }

  const expected = {
    type: 'object',
    properties: {
      pats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            note: {
              type: 'string',
            },
          },
          required: ['id', 'createdAt', 'note'],
          additionalProperties: false,
        },
      },
    },
    required: ['pats'],
    title: 'listPersonalAccessTokensResponse',
    additionalProperties: false,
  }

  const actual = setDefaultAdditionalProperties(input, false)
  expect(actual).toEqual(expected)
})

test('replaceOneOfWithAnyOf', () => {
  const input: JsonSchema = {
    type: 'object',
    properties: {
      id: {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      },
    },
    required: ['id'],
    additionalProperties: false,
  }

  const actual = replaceOneOfWithAnyOf(input)

  const expected: JsonSchema = {
    type: 'object',
    properties: {
      id: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      },
    },
    required: ['id'],
    additionalProperties: false,
  }

  expect(actual).toEqual(expected)
})

describe.sequential(generateSchemaFromZod, () => {
  it('documents in an output schema the value a prefault field takes when absent', () => {
    // Arrange
    const schema = z.object({
      nickname: z.string().prefault('potato'),
      sackCount: z.string().transform(Number).prefault('5'),
    })

    // Act
    const jsonSchema = generateSchemaFromZod(schema, { useOutput: true })

    // Assert
    expect(jsonSchema.properties).toMatchObject({ nickname: { default: 'potato' }, sackCount: { default: 5 } })
  })

  it('documents in an input schema the prefault value itself', () => {
    // Arrange
    const schema = z.object({ sackCount: z.string().transform(Number).prefault('5') })

    // Act
    const jsonSchema = generateSchemaFromZod(schema)

    // Assert
    expect(jsonSchema.properties).toMatchObject({ sackCount: { default: '5' } })
  })

  it.each([
    { case: 'a date', field: z.date(), allowUnions: false, expected: { type: 'string', format: 'date-time' } },
    { case: 'an integer', field: z.number().int(), allowUnions: false, expected: { type: 'integer' } },
    {
      case: 'an object accepting unknown keys',
      field: z.object({}).passthrough(),
      allowUnions: false,
      expected: { type: 'object', additionalProperties: true },
    },
    { case: 'any value', field: z.any(), allowUnions: false, expected: { nullable: true } },
    {
      case: 'a union',
      field: z.union([z.string(), z.number()]),
      allowUnions: true,
      expected: { oneOf: [{ type: 'string' }, { type: 'number' }] },
    },
    {
      case: 'an optional reference',
      field: z.string().meta({ $ref: '#/components/schemas/Bot' }).optional(),
      allowUnions: false,
      expected: { $ref: '#/components/schemas/Bot' },
    },
  ])('writes $case in the form opapi has always produced', ({ field, allowUnions, expected }) => {
    // Arrange
    const schema = z.object({ value: field })

    // Act
    const jsonSchema = generateSchemaFromZod(schema, { allowUnions })

    // Assert
    expect(jsonSchema.properties?.value).toStrictEqual(expected)
  })

  it('keeps fields typed any or unknown optional', () => {
    // Arrange
    const schema = z.object({ botName: z.string(), settings: z.any(), payload: z.unknown() })

    // Act
    const jsonSchema = generateSchemaFromZod(schema)

    // Assert
    expect(jsonSchema.required).toStrictEqual(['botName'])
  })

  it.each([
    {
      case: 'a UUID',
      field: z.uuid(),
      format: 'uuid',
      validValue: '0b9f1c1e-6d0a-4c3a-9f2e-3b1a2c4d5e6f',
      invalidValue: '0b9f1c1e-6d0a-0c3a-9f2e-3b1a2c4d5e6f',
    },
    {
      case: 'an email address',
      field: z.email(),
      format: 'email',
      validValue: 'maple@botpress.invalid',
      invalidValue: 'maple@botpress',
    },
    {
      case: 'a date-time',
      field: z.iso.datetime(),
      format: 'date-time',
      validValue: '2026-11-26T15:04:05Z',
      invalidValue: '2026-11-26T10:04:05-05:00',
    },
  ])('writes for $case the pattern zod checks it with', ({ field, format, validValue, invalidValue }) => {
    // Arrange
    const schema = z.object({ value: field })

    // Act
    const jsonSchema = generateSchemaFromZod(schema)

    // Assert
    const pattern = _.get(jsonSchema, ['properties', 'value', 'pattern'], '')
    expect(jsonSchema.properties?.value).toMatchObject({ format })
    expect({
      acceptsValidValue: new RegExp(pattern).test(validValue),
      acceptsInvalidValue: new RegExp(pattern).test(invalidValue),
    }).toStrictEqual({ acceptsValidValue: true, acceptsInvalidValue: false })
  })

  it('keeps a default and an example shaped like a reference wrapper as written', () => {
    // Arrange
    const schema = z.object({
      value: z
        .any()
        .default({ allOf: ['maple'] })
        .meta({ example: { allOf: ['oak'] } }),
    })

    // Act
    const jsonSchema = generateSchemaFromZod(schema)

    // Assert
    expect(jsonSchema.properties?.value).toMatchObject({ default: { allOf: ['maple'] }, example: { allOf: ['oak'] } })
  })
})
