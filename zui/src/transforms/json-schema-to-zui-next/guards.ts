import { JSONSchema7 } from 'json-schema'
import * as json from '../common/json-schema'
import z from '../../z'

export const isOptionalSchema = (s: JSONSchema7): s is json.OptionalSchema =>
  s.anyOf !== undefined &&
  s.anyOf.length === 2 &&
  s.anyOf.some((s) => typeof s !== 'boolean' && isUndefinedSchema(s)) &&
  (s as json.OptionalSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodOptional

export const isNullableSchema = (s: JSONSchema7): s is json.NullableSchema =>
  s.anyOf !== undefined &&
  s.anyOf.length === 2 &&
  s.anyOf.some((s) => typeof s !== 'boolean' && s.type === 'null') &&
  (s as json.NullableSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodNullable

export const isUndefinedSchema = (s: JSONSchema7): s is json.UndefinedSchema =>
  s.not === true && (s as json.UndefinedSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodUndefined

export const isUnknownSchema = (s: JSONSchema7): s is json.UnknownSchema =>
  !s.not && (s as json.UnknownSchema)['x-zui']?.def?.typeName === z.ZodFirstPartyTypeKind.ZodUnknown
