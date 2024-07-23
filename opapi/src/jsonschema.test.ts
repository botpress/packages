import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import {
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
