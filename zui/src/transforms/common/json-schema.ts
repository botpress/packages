import { JSONSchema7 } from 'json-schema'

type JSON = string | number | boolean | null | JSON[] | { [key: string]: JSON }

type Normalize<T extends object> = { [K in keyof T]: T[K] }

const ZUI_KEY = 'x-zui'
type ZuiExtensions = {
  title?: string
  disabled?: boolean
  hidden?: boolean
  tooltip?: boolean
  placeholder?: string
  secret?: boolean
  [k: string]: unknown
}

type BaseSchema = {
  readOnly?: boolean
  default?: JSON
  [ZUI_KEY]?: ZuiExtensions
}

type WithZuiBase<S extends JSONSchema7> = Normalize<S & BaseSchema>

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
export type ObjectSchema = Normalize<{ type: 'object'; properties: Record<string, ZuiJsonSchema>; required: string[] }>
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

const mock = <T>() => ({}) as T
const assertJSONSchema = (value: JSONSchema7) => value
assertJSONSchema(mock<StringSchema>())
assertJSONSchema(mock<NumberSchema>())
assertJSONSchema(mock<BigIntSchema>())
assertJSONSchema(mock<BooleanSchema>())
assertJSONSchema(mock<DateSchema>())
assertJSONSchema(mock<UndefinedSchema>())
assertJSONSchema(mock<NullSchema>())
assertJSONSchema(mock<AnySchema>())
assertJSONSchema(mock<UnknownSchema>())
assertJSONSchema(mock<NeverSchema>())
assertJSONSchema(mock<ArraySchema>())
assertJSONSchema(mock<ObjectSchema>())
assertJSONSchema(mock<UnionSchema>())
assertJSONSchema(mock<DiscriminatedUnionSchema>())
assertJSONSchema(mock<IntersectionSchema>())
assertJSONSchema(mock<TupleSchema>())
assertJSONSchema(mock<RecordSchema>())
assertJSONSchema(mock<MapSchema>())
assertJSONSchema(mock<SetSchema>())
assertJSONSchema(mock<LiteralStringSchema>())
assertJSONSchema(mock<LiteralNumberSchema>())
assertJSONSchema(mock<LiteralBooleanSchema>())
assertJSONSchema(mock<LiteralBigIntSchema>())
assertJSONSchema(mock<LiteralNullSchema>())
assertJSONSchema(mock<LiteralSchema>())
assertJSONSchema(mock<EnumSchema>())
assertJSONSchema(mock<RefSchema>())
assertJSONSchema(mock<ZuiJsonSchema>())

// @ts-expect-error
assertJSONSchema(mock<WithZuiBase<{ type: 'invalid' }>>())
// @ts-expect-error
assertJSONSchema(mock<WithZuiBase<{ $ref: number }>>())
