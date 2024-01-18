import { OpenApiZodAny, generateSchema as generateJsonSchema } from '@anatine/zod-openapi'
import { isReferenceObject, type SchemaObject } from 'openapi3-ts/oas31'
import { removeFromArray } from './utils/util'

export type GenerateSchemaFromZodOpts = {
  useOutput?: boolean
  allowUnions?: boolean
}

export const generateSchemaFromZod = (zodRef: OpenApiZodAny, opts?: GenerateSchemaFromZodOpts) => {
  const jsonSchema = generateJsonSchema(zodRef, opts?.useOutput)
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

    if (typeof jsonSchema.additionalProperties === 'object' && !isReferenceObject(jsonSchema.additionalProperties)) {
      formatJsonSchema(jsonSchema.additionalProperties, allowUnions)
    }

    Object.entries(jsonSchema.properties ?? {}).forEach(
      ([_, value]) => !isReferenceObject(value) && formatJsonSchema(value, allowUnions),
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
