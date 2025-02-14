import { JSONSchema7 } from 'json-schema'
import * as json from '../common/json-schema'
import z from '../../z'

/**
 * #############
 * ### Refs ####
 * #############
 */

export const isRefSchema = (s: JSONSchema7): s is json.RefSchema => s.$ref !== undefined

/**
 * ###############
 * ### Strings ###
 * ###############
 */

export const isDateSchema = (s: JSONSchema7): s is json.DateSchema =>
  s.type === 'string' &&
  s.format === 'date-time' &&
  (s as json.DateSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodDate

export const isLiteralStringSchema = (s: JSONSchema7): s is json.LiteralStringSchema =>
  s.type === 'string' && s.const !== undefined

export const isEnumSchema = (s: JSONSchema7): s is json.EnumSchema => s.type === 'string' && s.enum !== undefined

export const isStringSchema = (s: JSONSchema7): s is json.StringSchema => s.type === 'string'

/**
 * ###############
 * ### Numbers ###
 * ###############
 */

export const isLiteralBigIntSchema = (s: JSONSchema7): s is json.LiteralBigIntSchema =>
  s.type === 'integer' && s.const !== undefined // TODO: this could also be a number

export const isBigIntSchema = (s: JSONSchema7): s is json.BigIntSchema =>
  s.type === 'integer' && (s as json.BigIntSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodBigInt

export const isLiteralNumberSchema = (s: JSONSchema7): s is json.LiteralNumberSchema =>
  s.type === 'number' && s.const !== undefined

export const isNumberSchema = (s: JSONSchema7): s is json.NumberSchema => s.type === 'number' || s.type === 'integer'

/**
 * ################
 * ### Booleans ###
 * ################
 */

export const isLiteralBooleanSchema = (s: JSONSchema7): s is json.LiteralBooleanSchema =>
  s.type === 'boolean' && s.const !== undefined

export const isBooleanSchema = (s: JSONSchema7): s is json.BooleanSchema => s.type === 'boolean'

/**
 * ############
 * ### Null ###
 * ############
 */

export const isNullSchema = (s: JSONSchema7): s is json.NullSchema => s.type === 'null'

/**
 * ##############
 * ### Arrays ###
 * ##############
 */

export const isTupleSchema = (s: JSONSchema7): s is json.TupleSchema => s.type === 'array' && Array.isArray(s.items)

export const isSetSchema = (s: JSONSchema7): s is json.SetSchema => s.type === 'array' && s.uniqueItems === true

export const isArraySchema = (s: JSONSchema7): s is json.ArraySchema => s.type === 'array'

/**
 * #################
 * ### Objects #####
 * #################
 */

export const isRecordSchema = (s: JSONSchema7): s is json.RecordSchema =>
  s.type === 'object' && s.additionalProperties !== undefined

export const isObjectSchema = (s: JSONSchema7): s is json.ObjectSchema => s.type === 'object'

/**
 * #################
 * ### Unions ######
 * #################
 */

export const isOptionalSchema = (s: JSONSchema7): s is json.OptionalSchema =>
  s.anyOf !== undefined &&
  s.anyOf.length === 2 &&
  s.anyOf.some((s) => typeof s !== 'boolean' && isUndefinedSchema(s)) &&
  (s as json.OptionalSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodOptional

export const isNullableSchema = (s: JSONSchema7): s is json.NullableSchema =>
  s.anyOf !== undefined &&
  s.anyOf.length === 2 &&
  s.anyOf.some((s) => typeof s !== 'boolean' && isNullSchema(s)) &&
  (s as json.NullableSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodNullable

export const isDiscriminatedUnionSchema = (s: JSONSchema7): s is json.DiscriminatedUnionSchema =>
  s.anyOf !== undefined &&
  (s as json.DiscriminatedUnionSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion

export const isUnionSchema = (s: JSONSchema7): s is json.UnionSchema => s.anyOf !== undefined

export const isIntersectionSchema = (s: JSONSchema7): s is json.IntersectionSchema => s.allOf !== undefined

/**
 * #############
 * ### Never ###
 * #############
 */

export const isUndefinedSchema = (s: JSONSchema7): s is json.UndefinedSchema =>
  s.not === true && (s as json.UndefinedSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodUndefined

export const isNeverSchema = (s: JSONSchema7): s is json.NeverSchema => s.not === true

/**
 * #############
 * ### Any #####
 * #############
 */

export const isUnknownSchema = (s: JSONSchema7): s is json.UnknownSchema =>
  !s.not && (s as json.UnknownSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodUnknown

export const isAnySchema = (s: JSONSchema7): s is json.AnySchema => !s.not
