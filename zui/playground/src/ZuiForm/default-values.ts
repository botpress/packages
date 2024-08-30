import { ArraySchema, JSONSchema, TupleSchema } from '../json-schema'

/**
 * Type guards do not propagate type narrowings to parent objects, see:
 * https://stackoverflow.com/questions/73199307/do-discriminated-unions-only-work-with-literal-types
 */
const isTuple = (schema: ArraySchema | TupleSchema): schema is TupleSchema => Array.isArray(schema.items)
const isOptional = (schema: JSONSchema): boolean =>
  schema.anyOf?.some((s) => s.not && Object.keys(s.not).length === 0) || false

export const getDefaultValues = (schema: JSONSchema, optional?: boolean): any => {
  if (schema.type === 'null') {
    return null
  }

  if (schema.type === undefined) {
    if (schema.default) {
      return schema.default
    }
    return {} // any
  }

  if (schema.type === 'object' && schema.additionalProperties) {
    return {} // record
  }

  if (schema.type === 'array' && isTuple(schema)) {
    return schema.items.map((item) => getDefaultValues(item))
  }

  if (Array.isArray(schema)) {
    return getDefaultValues(schema[0]!)
  }

  if (schema.default) {
    return schema.default
  }

  if (schema.nullable) {
    return null
  }

  if (optional) {
    return undefined
  }

  if (schema.anyOf?.length) {
    return getDefaultValues(schema.anyOf[0]!)
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      const data: Record<string, any> = {}
      Object.entries(schema.properties).map(([key, fieldSchema]) => {
        data[key] = getDefaultValues(fieldSchema, !schema.required?.includes(key) || isOptional(fieldSchema) || false)
      })
      return data
    }
  }

  if (schema.type === 'array' && !Array.isArray(schema.items)) {
    if (schema.minItems && schema.minItems > 0) {
      return [getDefaultValues(schema.items)]
    }

    return []
  }

  if (schema.type === 'string') {
    if (schema.enum?.length) {
      return schema.enum[0]
    }
    return ''
  }

  if (schema.type === 'number') {
    if (schema.enum?.length) {
      return schema.enum[0]
    }
    return 0
  }

  if (schema.type === 'boolean') {
    if (schema.enum?.length) {
      return schema.enum[0]
    }
    return false
  }

  return undefined
}
