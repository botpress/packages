import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import { NullableJsonSchema, replaceNullableWithUnion } from './jsonschema'
import { jsonSchemaBuilder, JsonSchemaBuilder } from './handler-generator/utils'

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
  ]
}

const inputSchemas = buildSchemas(invalidBuilder)
const expectedSchemas = buildSchemas(validBuilder)

test('replaceNullableWithUnion', () => {
  for (let i = 0; i < inputSchemas.length; i++) {
    const inputSchema = inputSchemas[i]
    const expectedSchema = expectedSchemas[i]
    const actualSchema = replaceNullableWithUnion(inputSchema as NullableJsonSchema)
    expect(actualSchema).toEqual(expectedSchema)
  }
})
