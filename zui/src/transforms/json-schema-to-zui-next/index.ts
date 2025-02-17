import { JSONSchema7, JSONSchema7Definition, JSONSchema7Type } from 'json-schema'
import * as errors from '../common/errors'
import * as guards from './guards'
import z from '../../z'

const DEFAULT_TYPE = z.any()

/**
 *
 * @param schema json schema
 * @returns ZUI Schema
 */
export function fromJsonSchema(schema: JSONSchema7): z.ZodType {
  return _fromJsonSchema(schema)
}

function _fromJsonSchema(schema: JSONSchema7Definition | undefined): z.ZodType {
  if (schema === undefined) {
    return DEFAULT_TYPE
  }

  if (schema === true) {
    return z.any()
  }

  if (schema === false) {
    return z.never()
  }

  if (schema.default !== undefined) {
    const inner = _fromJsonSchema({ ...schema, default: undefined })
    return inner.default(schema.default)
  }
  if (schema.readOnly) {
    const inner = _fromJsonSchema({ ...schema, readOnly: undefined })
    return inner.readonly()
  }

  if (schema.oneOf !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ oneOf: schema.oneOf })
  }

  if (schema.patternProperties !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ patternProperties: schema.patternProperties })
  }

  if (schema.propertyNames !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ propertyNames: schema.propertyNames })
  }

  if (schema.if !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ if: schema.if })
  }

  if (schema.then !== undefined) {
    // eslint-disable-next-line no-thenable
    throw new errors.UnsupportedJSONSchemaToZuiError({ then: schema.then })
  }

  if (schema.else !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ else: schema.else })
  }

  if (schema.$ref !== undefined) {
    return z.ref(schema.$ref)
  }

  if (schema.not !== undefined) {
    if (guards.isUndefinedSchema(schema)) {
      return z.undefined()
    }
    if (schema.not === true) {
      return z.never()
    }
    throw new errors.UnsupportedJSONSchemaToZuiError({ not: schema.not })
  }

  if (Array.isArray(schema.type)) {
    if (schema.type.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.type.length === 1) {
      return _fromJsonSchema({ ...schema, type: schema.type[0] })
    }
    const { type: _, ...tmp } = schema
    const types = schema.type.map((t) => _fromJsonSchema({ ...tmp, type: t })) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(types)
  }

  if (schema.type === 'string') {
    if (guards.isDateSchema(schema)) {
      return z.date()
    }
    if (schema.enum && schema.enum.length > 0) {
      return z.enum(schema.enum as [string, ...string[]])
    }
    return _toZuiPrimitive('string', schema)
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    if (guards.isBigIntSchema(schema)) {
      return z.bigint()
    }
    return _toZuiPrimitive('number', schema)
  }

  if (schema.type === 'boolean') {
    return _toZuiPrimitive('boolean', schema)
  }

  if (schema.type === 'null') {
    return _toZuiPrimitive('null', schema)
  }

  if (schema.type === 'array') {
    if (Array.isArray(schema.items)) {
      const itemSchemas = schema.items.map(_fromJsonSchema) as [] | [z.ZodType, ...z.ZodType[]]
      if (schema.additionalItems !== undefined) {
        return z.tuple(itemSchemas).rest(_fromJsonSchema(schema.additionalItems))
      }
      return z.tuple(itemSchemas)
    }

    if (schema.items !== undefined) {
      if (schema.uniqueItems) {
        return z.set(_fromJsonSchema(schema.items))
      }

      // TODO: ensure empty array gets modeled as z.tuple([]) instead of z.array(z.never())
      return z.array(_fromJsonSchema(schema.items))
    }

    return z.array(DEFAULT_TYPE)
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties !== undefined && schema.properties !== undefined) {
      // TODO: technically an intersection between object and record
    }

    if (schema.additionalProperties !== undefined) {
      // TODO: ensure empty object gets modeled as z.object({}) instead of z.record(z.never())
      const inner = _fromJsonSchema(schema.additionalProperties)
      return z.record(inner)
    }

    if (schema.properties !== undefined) {
      const properties: Record<string, z.ZodType> = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        const mapped: z.ZodType = _fromJsonSchema(value)
        const required: string[] = schema.required ?? []
        properties[key] = required.includes(key) ? mapped : mapped.optional()
      }
      return z.object(properties)
    }

    return z.record(DEFAULT_TYPE)
  }

  if (schema.anyOf !== undefined) {
    if (schema.anyOf.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.anyOf.length === 1) {
      return _fromJsonSchema(schema.anyOf[0])
    }

    if (guards.isDiscriminatedUnionSchema(schema)) {
      const { discriminator } = schema['x-zui']?.def!
      const options = schema.anyOf.map(_fromJsonSchema) as [
        z.ZodDiscriminatedUnionOption<string>,
        ...z.ZodDiscriminatedUnionOption<string>[],
      ]
      return z.discriminatedUnion(discriminator, options)
    }

    if (guards.isOptionalSchema(schema)) {
      const inner = _fromJsonSchema(schema.anyOf[0])
      return inner.optional()
    }

    if (guards.isNullableSchema(schema)) {
      const inner = _fromJsonSchema(schema.anyOf[0])
      return inner.nullable()
    }

    const options = schema.anyOf.map(_fromJsonSchema) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(options)
  }

  if (schema.allOf !== undefined) {
    if (schema.allOf.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.allOf.length === 1) {
      return _fromJsonSchema(schema.allOf[0])
    }
    const [left, ...right] = schema.allOf as [JSONSchema7, ...JSONSchema7[]]
    const zLeft = _fromJsonSchema(left)
    const zRight = _fromJsonSchema({ allOf: right })
    return z.intersection(zLeft, zRight)
  }

  type _expectUndefined = z.util.AssertTrue<z.util.IsEqual<typeof schema.type, undefined>>

  if (guards.isUnknownSchema(schema)) {
    return z.unknown()
  }
  return DEFAULT_TYPE
}

const _toZuiPrimitive = <T extends 'string' | 'number' | 'boolean' | 'null'>(
  type: T,
  schema: JSONSchema7,
): z.ZodType => {
  let values: JSONSchema7Type[] = []
  if (schema.enum !== undefined) {
    values.push(...schema.enum)
  }
  if (schema.const !== undefined) {
    values.push(schema.const)
  }
  values = values.filter((value) => typeof value === type)
  if (values.length === 0) {
    return type === 'string'
      ? z.string()
      : type === 'number'
        ? z.number()
        : type === 'boolean'
          ? z.boolean()
          : type === 'null'
            ? z.null()
            : DEFAULT_TYPE
  }

  if (values.length === 1) {
    const value = values[0] as z.Primitive
    return z.literal(value)
  }

  const items = values.map((value) => z.literal(value as z.Primitive)) as [
    z.ZodLiteral,
    z.ZodLiteral,
    ...z.ZodLiteral[],
  ]

  return z.union(items)
}
