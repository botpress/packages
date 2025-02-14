import { JSONSchema7 } from 'json-schema'
import z, { util } from '../../z'
import * as guards from './guards'

/**
 *
 * @param schema json schema
 * @returns ZUI Schema
 */
export function toZui(schema: JSONSchema7): z.ZodType {
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
    return values.length >= 1 ? z.enum(schema.enum as [string, ...string[]]) : toZui({ ...schema, enum: undefined })
  }

  if (guards.isStringSchema(schema)) {
    return z.string()
  }

  // numbers

  if (guards.isLiteralBigIntSchema(schema)) {
    return z.literal(schema.const)
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
    const items = schema.items.map(toZui) as [z.ZodType, ...z.ZodType[]]
    if (schema.additionalItems) {
      return z.tuple(items).rest(toZui(schema.additionalItems))
    }
    return z.tuple(items)
  }

  if (guards.isSetSchema(schema)) {
    return z.set(toZui(schema.items))
  }

  if (guards.isArraySchema(schema)) {
    const items = schema.items ? toZui(schema.items) : z.unknown()
    return z.array(items)
  }

  // objects

  if (guards.isObjectSchema(schema)) {
    const properties = schema.properties
    const required = schema.required || []
    const propMap: Record<string, z.ZodType> = {}
    for (const key in properties) {
      const prop = properties[key]
      if (prop !== undefined) {
        const zProp = toZui(prop)
        propMap[key] = required.includes(key) ? zProp : zProp.optional()
      }
    }
    return z.object(propMap)
  }

  if (guards.isRecordSchema(schema)) {
    return z.record(toZui(schema.additionalProperties))
  }

  // unions

  if (guards.isOptionalSchema(schema)) {
    return toZui(schema.anyOf[0]).optional()
  }

  if (guards.isNullableSchema(schema)) {
    return toZui(schema.anyOf[0]).nullable()
  }

  if (guards.isDiscriminatedUnionSchema(schema)) {
    if (schema.anyOf.length < 2) {
      return toZui({ ...schema, anyOf: undefined })
    }

    const options = schema.anyOf.map(toZui) as [
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
      return toZui({ ...schema, anyOf: undefined })
    }
    const options = schema.anyOf.map(toZui) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(options)
  }

  if (guards.isIntersectionSchema(schema)) {
    if (schema.allOf.length < 2) {
      return toZui({ ...schema, allOf: undefined })
    }

    const [left, ...right] = schema.allOf as [JSONSchema7, ...JSONSchema7[]]
    return z.intersection(toZui(left), toZui({ ...schema, allOf: right }))
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
