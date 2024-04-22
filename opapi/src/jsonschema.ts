import { OpenApiZodAny, generateSchema as generateJsonSchema } from '@anatine/zod-openapi'
import { JSONSchema7 } from 'json-schema'
import type { SchemaObject } from 'openapi3-ts'
import { removeFromArray } from './util'
import _ from 'lodash'

export type GenerateSchemaFromZodOpts = {
  useOutput?: boolean
  allowUnions?: boolean
}

export type JsonSchema = JSONSchema7
export type NullableJsonSchema = JSONSchema7 & { nullable?: boolean }

export const generateSchemaFromZod = (zodRef: OpenApiZodAny, opts?: GenerateSchemaFromZodOpts) => {
  const jsonSchema = generateJsonSchema(zodRef, opts?.useOutput) as SchemaObject
  formatJsonSchema(jsonSchema, opts?.allowUnions ?? false)
  return jsonSchema
}

export const formatJsonSchema = (jsonSchema: SchemaObject, allowUnions: boolean) => {
  if (jsonSchema.type === 'object') {
    if (jsonSchema.additionalProperties === undefined) {
      jsonSchema.additionalProperties = false
    }

    if (jsonSchema.properties && Object.keys(jsonSchema.properties).length === 0) {
      delete jsonSchema.properties
    }

    if (jsonSchema.required && jsonSchema.required.length === 0) {
      delete jsonSchema.required
    }

    if (typeof jsonSchema.additionalProperties === 'object') {
      formatJsonSchema(jsonSchema.additionalProperties as SchemaObject, allowUnions)
    }

    Object.entries(jsonSchema.properties ?? {}).forEach(([_, value]) =>
      formatJsonSchema(value as SchemaObject, allowUnions),
    )
  }

  if (!allowUnions && (jsonSchema.allOf || jsonSchema.anyOf || jsonSchema.oneOf)) {
    throw new Error('allOf, anyOf and oneOf are not supported')
  }
}

export function schemaIsEmptyObject(schema: SchemaObject) {
  const keys = Object.keys(schema)

  removeFromArray(keys, 'title')
  removeFromArray(keys, 'description')

  if (keys.length === 0) {
    return true
  }

  if (
    keys.length === 2 &&
    keys.includes('type') &&
    schema.type === 'object' &&
    keys.includes('additionalProperties') &&
    schema.additionalProperties === false
  ) {
    return true
  }

  return false
}

/**
 * Lib "@anatine/zod-openapi" transforms zod to json-schema using the nullable property.
 * This property is not officially supported by json-schema, but supported by ajv (see: https://ajv.js.org/json-schema.html#nullable)
 * Since it's not officially supported, some tools like "json-schema-to-typescript" don't support it.
 * This function replaces all occurences of { type: T, nullable: true } with { anyOf: [{ type: T }, { type: 'null' }] }
 */
export const replaceNullableWithUnion = (nullableSchema: NullableJsonSchema): JSONSchema7 => {
  const { nullable, ...schema } = nullableSchema
  if (nullable) {
    const { title, description, ...rest } = replaceNullableWithUnion(schema)
    return { title, description, anyOf: [rest, { type: 'null' }] }
  }

  if (schema.type === 'object') {
    const properties = schema.properties ? _.mapValues(schema.properties, replaceNullableWithUnion) : schema.properties
    const additionalProperties =
      typeof schema.additionalProperties === 'object'
        ? replaceNullableWithUnion(schema.additionalProperties)
        : schema.additionalProperties
    return { ...schema, properties, additionalProperties }
  }

  if (schema.type === 'array') {
    if (schema.items === undefined) {
      return schema
    }
    if (Array.isArray(schema.items)) {
      return { ...schema, items: schema.items.map((s) => replaceNullableWithUnion(s as NullableJsonSchema)) }
    }
    return { ...schema, items: replaceNullableWithUnion(schema.items as NullableJsonSchema) }
  }

  return schema
}

export const setDefaultAdditionalProperties = (schema: JsonSchema, additionalProperties: boolean): void => {
  if (schema.type === 'object') {
    if (schema.additionalProperties === undefined) {
      schema.additionalProperties = additionalProperties
    }

    _.mapValues(
      schema.properties,
      (s) => typeof s === 'object' && setDefaultAdditionalProperties(s, additionalProperties),
    )

    if (typeof schema.additionalProperties === 'object') {
      setDefaultAdditionalProperties(schema.additionalProperties, additionalProperties)
    }
  }

  if (schema.type === 'array') {
    if (schema.items === undefined) {
      return
    }

    if (Array.isArray(schema.items)) {
      schema.items.forEach((s) => typeof s === 'object' && setDefaultAdditionalProperties(s, additionalProperties))
      return
    }

    if (typeof schema.items === 'object') {
      setDefaultAdditionalProperties(schema.items, additionalProperties)
    }
  }
}
