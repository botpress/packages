import { JSONSchema7 } from 'json-schema'
import z, { util } from '../../z'
import * as guards from './guards'

/**
 *
 * @param schema json schema
 * @returns ZUI Schema
 */
export function fromJsonSchema(schema: JSONSchema7): z.ZodType {
  // annotations
  if (schema.default !== undefined) {
    const inner = fromJsonSchema({ ...schema, default: undefined })
    return inner.default(schema.default)
  }
  if (schema.readOnly) {
    const inner = fromJsonSchema({ ...schema, readOnly: undefined })
    return inner.readonly()
  }

  // ref

  if (guards.isRefSchema(schema)) {
    return z.ref(schema.$ref)
  }

  // strings

  if (guards.isDateSchema(schema)) {
    return z.date()
  }

  if (guards.isLiteralStringSchema(schema)) {
    return z.literal(schema.const)
  }

  if (guards.isEnumSchema(schema)) {
    const values = schema.enum
    return values.length >= 1
      ? z.enum(schema.enum as [string, ...string[]])
      : fromJsonSchema({ ...schema, enum: undefined })
  }

  if (guards.isStringSchema(schema)) {
    return z.string()
  }

  // numbers

  if (guards.isLiteralBigIntSchema(schema)) {
    return z.literal(BigInt(schema.const))
  }

  if (guards.isBigIntSchema(schema)) {
    return z.bigint()
  }

  if (guards.isLiteralNumberSchema(schema)) {
    return z.literal(schema.const)
  }

  if (guards.isNumberSchema(schema)) {
    return z.number()
  }

  // booleans

  if (guards.isLiteralBooleanSchema(schema)) {
    return z.literal(schema.const)
  }

  if (guards.isBooleanSchema(schema)) {
    return z.boolean()
  }

  // null

  if (guards.isNullSchema(schema)) {
    return z.null()
  }

  // arrays

  if (guards.isTupleSchema(schema)) {
    const items = schema.items.map(fromJsonSchema) as [z.ZodType, ...z.ZodType[]]
    if (schema.additionalItems) {
      return z.tuple(items).rest(fromJsonSchema(schema.additionalItems))
    }
    return z.tuple(items)
  }

  if (guards.isSetSchema(schema)) {
    return z.set(fromJsonSchema(schema.items))
  }

  if (guards.isArraySchema(schema)) {
    const items = schema.items ? fromJsonSchema(schema.items) : z.unknown()
    return z.array(items)
  }

  // objects

  if (guards.isRecordSchema(schema)) {
    return z.record(fromJsonSchema(schema.additionalProperties))
  }

  if (guards.isObjectSchema(schema)) {
    const properties = schema.properties
    const required = schema.required ?? []
    const propMap: Record<string, z.ZodType> = {}
    for (const [key, prop] of Object.entries(properties)) {
      const zProp = fromJsonSchema(prop)
      propMap[key] = required.includes(key) ? zProp : zProp.optional()
    }
    return z.object(propMap)
  }

  // unions

  if (guards.isOptionalSchema(schema)) {
    return fromJsonSchema(schema.anyOf[0]).optional()
  }

  if (guards.isNullableSchema(schema)) {
    return fromJsonSchema(schema.anyOf[0]).nullable()
  }

  if (guards.isDiscriminatedUnionSchema(schema)) {
    if (schema.anyOf.length < 2) {
      return fromJsonSchema({ ...schema, anyOf: undefined })
    }

    const options = schema.anyOf.map(fromJsonSchema) as [
      z.ZodDiscriminatedUnionOption<string>,
      z.ZodDiscriminatedUnionOption<string>,
      ...z.ZodDiscriminatedUnionOption<string>[],
    ]
    const discriminator = schema['x-zui']?.def?.discriminator
    if (discriminator !== undefined) {
      return z.discriminatedUnion(discriminator, options)
    }
    return z.union(options)
  }

  if (guards.isUnionSchema(schema)) {
    if (schema.anyOf.length < 2) {
      return fromJsonSchema({ ...schema, anyOf: undefined })
    }
    const options = schema.anyOf.map(fromJsonSchema) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(options)
  }

  if (guards.isIntersectionSchema(schema)) {
    if (schema.allOf.length < 2) {
      return fromJsonSchema({ ...schema.allOf[0], allOf: undefined })
    }

    const [left, ...right] = schema.allOf as [JSONSchema7, ...JSONSchema7[]]
    const zLeft = fromJsonSchema(left)
    const zRight = fromJsonSchema({ allOf: right })
    return z.intersection(zLeft, zRight)
  }

  // never

  if (guards.isUndefinedSchema(schema)) {
    return z.undefined()
  }

  if (guards.isNeverSchema(schema)) {
    return z.never()
  }

  // any

  if (guards.isUnknownSchema(schema)) {
    return z.unknown()
  }

  type _assertion = util.AssertNever<typeof schema>
  return z.any()
}
