import { JSONSchema7 } from 'json-schema'
import { util } from '../../z/types/utils'

type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData }
type Normalize<T extends object> = { [K in keyof T]: T[K] }

type ZuiExtension = {
  title?: string
  disabled?: boolean
  hidden?: boolean
  tooltip?: boolean
  placeholder?: string
  secret?: boolean
  [k: string]: unknown
}

type WithZuiBase<S extends JSONSchema7> = Normalize<
  S & {
    readOnly?: boolean
    default?: JsonData
    ['x-zui']?: ZuiExtension
  }
>

/**
 * Currently mutiple zui schemas map to the same JSON schema; undefined/never, any/unknown, union/discriminated-union
 * TODO: add ZuiDef information in x-zui to enforce the correct zui type when mapping back to zui
 */

export type StringSchema = WithZuiBase<{ type: 'string' }>
export type NumberSchema = WithZuiBase<{ type: 'number' }>
export type BigIntSchema = WithZuiBase<{ type: 'integer' }>
export type BooleanSchema = WithZuiBase<{ type: 'boolean' }>
export type DateSchema = WithZuiBase<{ type: 'string'; format: 'date-time' }>
export type NullSchema = WithZuiBase<{ type: 'null' }>
export type UndefinedSchema = WithZuiBase<{ not: true }>
export type NeverSchema = WithZuiBase<{ not: true }>
export type AnySchema = WithZuiBase<{}>
export type UnknownSchema = WithZuiBase<{}>
export type ArraySchema = WithZuiBase<{ type: 'array'; items: ZuiJsonSchema }>
export type UnionSchema = WithZuiBase<{ anyOf: ZuiJsonSchema[] }>
export type DiscriminatedUnionSchema = WithZuiBase<{ anyOf: ZuiJsonSchema[] }>
export type IntersectionSchema = WithZuiBase<{ allOf: [ZuiJsonSchema, ZuiJsonSchema] }>
export type MapSchema = WithZuiBase<{ type: 'object'; additionalProperties: ZuiJsonSchema }>
export type SetSchema = WithZuiBase<{ type: 'array'; items: ZuiJsonSchema; uniqueItems: true }>
export type EnumSchema = WithZuiBase<{ type: 'string'; enum: string[] }>
export type RefSchema = WithZuiBase<{ $ref: string }>
export type ObjectSchema = WithZuiBase<{
  type: 'object'
  properties: Record<string, ZuiJsonSchema>
  required: string[]
}>
export type TupleSchema = WithZuiBase<{ type: 'array'; items: ZuiJsonSchema[]; additionalItems: ZuiJsonSchema }>
export type RecordSchema = WithZuiBase<{ type: 'object'; additionalProperties: ZuiJsonSchema }>
export type LiteralStringSchema = WithZuiBase<{ type: 'string'; const: string }>
export type LiteralNumberSchema = WithZuiBase<{ type: 'number'; const: number }>
export type LiteralBooleanSchema = WithZuiBase<{ type: 'boolean'; const: boolean }>
export type LiteralBigIntSchema = WithZuiBase<{ type: 'integer'; const: number }>
export type LiteralNullSchema = WithZuiBase<{ type: 'null'; const: null }>
export type LiteralSchema =
  | LiteralStringSchema
  | LiteralNumberSchema
  | LiteralBooleanSchema
  | LiteralBigIntSchema
  | LiteralNullSchema

/**
 * ZuiJsonSchema; a ZUI flavored subset of JSONSchema7
 */
export type ZuiJsonSchema =
  | StringSchema
  | NumberSchema
  | BigIntSchema
  | BooleanSchema
  | DateSchema
  | UndefinedSchema
  | NullSchema
  | AnySchema
  | UnknownSchema
  | NeverSchema
  | ArraySchema
  | ObjectSchema
  | UnionSchema
  | DiscriminatedUnionSchema
  | IntersectionSchema
  | TupleSchema
  | RecordSchema
  | MapSchema
  | SetSchema
  | LiteralSchema
  | EnumSchema
  | RefSchema

// tests

util.assertIs<JSONSchema7>(util.mock<StringSchema>())
util.assertIs<JSONSchema7>(util.mock<NumberSchema>())
util.assertIs<JSONSchema7>(util.mock<BigIntSchema>())
util.assertIs<JSONSchema7>(util.mock<BooleanSchema>())
util.assertIs<JSONSchema7>(util.mock<DateSchema>())
util.assertIs<JSONSchema7>(util.mock<UndefinedSchema>())
util.assertIs<JSONSchema7>(util.mock<NullSchema>())
util.assertIs<JSONSchema7>(util.mock<AnySchema>())
util.assertIs<JSONSchema7>(util.mock<UnknownSchema>())
util.assertIs<JSONSchema7>(util.mock<NeverSchema>())
util.assertIs<JSONSchema7>(util.mock<ArraySchema>())
util.assertIs<JSONSchema7>(util.mock<ObjectSchema>())
util.assertIs<JSONSchema7>(util.mock<UnionSchema>())
util.assertIs<JSONSchema7>(util.mock<DiscriminatedUnionSchema>())
util.assertIs<JSONSchema7>(util.mock<IntersectionSchema>())
util.assertIs<JSONSchema7>(util.mock<TupleSchema>())
util.assertIs<JSONSchema7>(util.mock<RecordSchema>())
util.assertIs<JSONSchema7>(util.mock<MapSchema>())
util.assertIs<JSONSchema7>(util.mock<SetSchema>())
util.assertIs<JSONSchema7>(util.mock<LiteralStringSchema>())
util.assertIs<JSONSchema7>(util.mock<LiteralNumberSchema>())
util.assertIs<JSONSchema7>(util.mock<LiteralBooleanSchema>())
util.assertIs<JSONSchema7>(util.mock<LiteralBigIntSchema>())
util.assertIs<JSONSchema7>(util.mock<LiteralNullSchema>())
util.assertIs<JSONSchema7>(util.mock<LiteralSchema>())
util.assertIs<JSONSchema7>(util.mock<EnumSchema>())
util.assertIs<JSONSchema7>(util.mock<RefSchema>())
util.assertIs<JSONSchema7>(util.mock<ZuiJsonSchema>())
// @ts-expect-error
util.assertIs<JSONSchema7>(util.mock<WithZuiBase<{ type: 'invalid' }>>())
// @ts-expect-error
util.assertIs<JSONSchema7>(util.mock<WithZuiBase<{ $ref: number }>>())
