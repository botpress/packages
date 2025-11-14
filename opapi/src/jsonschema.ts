import { OpenApiZodAny, extendApi, generateSchema as generateJsonSchema } from '@anatine/zod-openapi'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import type { SchemaObject } from 'openapi3-ts'
import { removeFromArray } from './util'
import _ from 'lodash'
import { SchemaOfType } from './state'

export type GenerateSchemaFromZodOpts = {
  useOutput?: boolean
  allowUnions?: boolean
}

export type NullableJsonSchema = JSONSchema7 & { nullable?: boolean }

export const isZodSchema = (source: SchemaOfType<'any-schema'>): source is OpenApiZodAny => {
  return '_def' in source
}

export const isJSONSchema = (source: SchemaOfType<'any-schema'>): source is JSONSchema7 => {
  if (isZodSchema(source)) {
    return false
  }
  if (!('exclusiveMinimum' in source) && !('exclusiveMaximum' in source)) {
    return true
  }
  if (
    ('exclusiveMinimum' in source && typeof source['exclusiveMinimum'] === 'number') ||
    ('exclusiveMaximum' in source && typeof source['exclusiveMaximum'] === 'number')
  ) {
    return true
  }
  return false
}

export const jsonSchemaToSchemaObject = (source: JSONSchema7): SchemaObject => {
  const schema = source as any
  if ('exclusiveMinimum' in schema) {
    schema['minimum'] = schema['exclusiveMinimum']
    schema['exclusiveMinimum'] = true
  }
  if ('exclusiveMaximum' in schema) {
    schema['minimum'] = schema['exclusiveMaximum']
    schema['exclusiveMaximum'] = true
  }
  return schema as SchemaObject
}

export const extendSchema = <T extends SchemaOfType<'any-schema'>>(source: T, extra: SchemaObject): T => {
  if (!isZodSchema(source)) {
    Object.assign(source, extra)
    return source
  }
  return extendApi(source, extra)
}

export const convertToJsonSchema = (
  source: SchemaOfType<'any-schema'>,
  opts?: GenerateSchemaFromZodOpts,
): SchemaObject => {
  let schema: SchemaObject | undefined = undefined
  if (isZodSchema(source)) {
    schema = generateJsonSchema(source, opts?.useOutput) as SchemaObject
  }
  if (isJSONSchema(source)) {
    schema = jsonSchemaToSchemaObject(source)
  }
  if (!isJSONSchema(source) && !isZodSchema(source)) {
    schema = source
  }
  if (schema === undefined) {
    throw new Error('Invalid state. An internal error occured.')
  }
  formatJsonSchema(schema, opts?.allowUnions ?? false)
  return schema
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
  (cb: (s: JSONSchema7) => JSONSchema7) =>
  (inputSchema: JSONSchema7Definition): JSONSchema7Definition => {
    if (typeof inputSchema === 'boolean') {
      return inputSchema
    }
    return exploreJSONSchema7(cb)(inputSchema)
  }

export const exploreJSONSchema7 =
  (cb: (s: JSONSchema7) => JSONSchema7) =>
  (inputSchema: JSONSchema7): JSONSchema7 => {
    const mappedSchema = cb(inputSchema)

    if (mappedSchema.type === 'object') {
      const properties = mappedSchema.properties
        ? _.mapValues(mappedSchema.properties, exploreJSONSchema7(cb))
        : mappedSchema.properties
      const additionalProperties =
        typeof mappedSchema.additionalProperties === 'object'
          ? exploreJSONSchema7(cb)(mappedSchema.additionalProperties)
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
  const mapper = exploreJSONSchema7((s) => {
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
export const replaceOneOfWithAnyOf = (oneOfSchema: JSONSchema7): JSONSchema7 => {
  const mapper = exploreJSONSchema7((schema) => {
    if (schema.oneOf) {
      const { oneOf, ...rest } = schema
      return { anyOf: oneOf, ...rest }
    }
    return schema
  })
  return mapper(oneOfSchema)
}

const _setDefaultAdditionalPropertiesInPlace = (schema: JSONSchema7, additionalProperties: boolean): void => {
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

export const setDefaultAdditionalProperties = (schema: JSONSchema7, additionalProperties: boolean): JSONSchema7 => {
  const copy = _.cloneDeep(schema)
  _setDefaultAdditionalPropertiesInPlace(copy, additionalProperties)
  return copy
}
