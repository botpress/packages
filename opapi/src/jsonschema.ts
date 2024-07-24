import { OpenApiZodAny, generateSchema as generateJsonSchema } from '@anatine/zod-openapi'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
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

const exploreJsonSchemaDef =
  (cb: (s: JsonSchema) => JsonSchema) =>
  (inputSchema: JSONSchema7Definition): JSONSchema7Definition => {
    if (typeof inputSchema === 'boolean') {
      return inputSchema
    }
    return exploreJsonSchema(cb)(inputSchema)
  }

export const exploreJsonSchema =
  (cb: (s: JsonSchema) => JsonSchema) =>
  (inputSchema: JsonSchema): JsonSchema => {
    const mappedSchema = cb(inputSchema)

    if (mappedSchema.type === 'object') {
      const properties = mappedSchema.properties
        ? _.mapValues(mappedSchema.properties, exploreJsonSchema(cb))
        : mappedSchema.properties
      const additionalProperties =
        typeof mappedSchema.additionalProperties === 'object'
          ? exploreJsonSchema(cb)(mappedSchema.additionalProperties)
          : mappedSchema.additionalProperties
      return { ...mappedSchema, properties, additionalProperties }
    }

    if (mappedSchema.type === 'array') {
      if (mappedSchema.items === undefined) {
        return mappedSchema
      }
      if (Array.isArray(mappedSchema.items)) {
        return {
          ...mappedSchema,
          items: mappedSchema.items.map(exploreJsonSchemaDef(cb)),
        }
      }
      return { ...mappedSchema, items: exploreJsonSchemaDef(cb)(mappedSchema.items) }
    }

    if (mappedSchema.anyOf) {
      return {
        ...mappedSchema,
        anyOf: mappedSchema.anyOf.map(exploreJsonSchemaDef(cb)),
      }
    }

    if (mappedSchema.allOf) {
      return {
        ...mappedSchema,
        allOf: mappedSchema.allOf.map(exploreJsonSchemaDef(cb)),
      }
    }

    if (mappedSchema.oneOf) {
      return {
        ...mappedSchema,
        oneOf: mappedSchema.oneOf.map(exploreJsonSchemaDef(cb)),
      }
    }

    return mappedSchema
  }

/**
 * Lib "@anatine/zod-openapi" transforms zod to json-schema using the nullable property.
 * This property is not officially supported by json-schema, but supported by ajv (see: https://ajv.js.org/json-schema.html#nullable)
 * Since it's not officially supported, some tools like "json-schema-to-typescript" don't support it.
 * This function replaces all occurences of { type: T, nullable: true } with { anyOf: [{ type: T }, { type: 'null' }] }
 */
export const replaceNullableWithUnion = (schema: NullableJsonSchema): JSONSchema7 => {
  const mapper = exploreJsonSchema((s) => {
    const { nullable, ...schema } = s as NullableJsonSchema
    if (nullable) {
      const { title, description, ...rest } = schema
      return { title, description, anyOf: [rest, { type: 'null' }] }
    }
    return schema
  })
  return mapper(schema)
}

/**
 * Lib "@anatine/zod-openapi" transforms zod unions to json-schema oneOf.
 * This is a mistake as a union does not enforce that only one of the types is present.
 * This function replaces all occurences of { oneOf: [{ type: T1 }, { type: T2 }] } with { anyOf: [{ type: T1 }, { type: T2 }] }
 */
export const replaceOneOfWithAnyOf = (oneOfSchema: JsonSchema): JSONSchema7 => {
  const mapper = exploreJsonSchema((schema) => {
    if (schema.oneOf) {
      const { oneOf, ...rest } = schema
      return { anyOf: oneOf, ...rest }
    }
    return schema
  })
  return mapper(oneOfSchema)
}

const _setDefaultAdditionalPropertiesInPlace = (schema: JsonSchema, additionalProperties: boolean): void => {
  if (schema.type === 'object') {
    schema.additionalProperties ??= additionalProperties

    Object.values(schema.properties ?? {}).forEach(
      (s) => typeof s === 'object' && _setDefaultAdditionalPropertiesInPlace(s, additionalProperties),
    )

    if (typeof schema.additionalProperties === 'object') {
      _setDefaultAdditionalPropertiesInPlace(schema.additionalProperties, additionalProperties)
    }

    return
  }

  if (schema.type === 'array') {
    if (schema.items === undefined) {
      return
    }

    if (Array.isArray(schema.items)) {
      schema.items.forEach(
        (s) => typeof s === 'object' && _setDefaultAdditionalPropertiesInPlace(s, additionalProperties),
      )
      return
    }

    if (typeof schema.items === 'object') {
      _setDefaultAdditionalPropertiesInPlace(schema.items, additionalProperties)
    }

    return
  }

  return
}

export const setDefaultAdditionalProperties = (schema: JsonSchema, additionalProperties: boolean): JsonSchema => {
  const copy = _.cloneDeep(schema)
  _setDefaultAdditionalPropertiesInPlace(copy, additionalProperties)
  return copy
}
