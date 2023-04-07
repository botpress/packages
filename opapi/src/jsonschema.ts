import { OpenApiZodAny, generateSchema as generateJsonSchema } from '@anatine/zod-openapi'
import type { SchemaObject } from 'openapi3-ts'

export const generateSchemaFromZod = (zodRef: OpenApiZodAny, useOutput?: boolean) => {
  const jsonSchema = generateJsonSchema(zodRef, useOutput)
  formatJsonSchema(jsonSchema)
  return jsonSchema
}

export const formatJsonSchema = (jsonSchema: SchemaObject) => {
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
      formatJsonSchema(jsonSchema.additionalProperties)
    }

    Object.entries(jsonSchema.properties ?? {}).forEach(([_, value]) => formatJsonSchema(value))
  }

  if (jsonSchema.allOf || jsonSchema.anyOf || jsonSchema.oneOf) {
    throw new Error('allOf, anyOf and oneOf are not supported')
  }
}
