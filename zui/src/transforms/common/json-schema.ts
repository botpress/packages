import { JSONSchema7 } from 'json-schema'
import { util } from '../../z/types/utils'
import z from '../../z'

/**
 * Definitions:
 *
 * Mutiple zui schemas map to the same JSON schema; undefined/never, any/unknown, union/discriminated-union
 * Adding some ZodDef to the ZuiExtension allows us to differentiate between them
 */

type UnionDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUnion }, Partial<z.ZodUnionDef>>
type DiscriminatedUnionDef = util.Satisfies<
  { typeName: z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion },
  Partial<z.ZodDiscriminatedUnionDef>
>
type UndefinedDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUndefined }, Partial<z.ZodUndefinedDef>>
type NeverDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodNever }, Partial<z.ZodNeverDef>>
type AnyDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodAny }, Partial<z.ZodAnyDef>>
type UnknownDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUnknown }, Partial<z.ZodUnknownDef>>

/**
 * ZuiExtension
 */

type ZuiExtension<Def extends Partial<z.ZodDef> = {}> = {
  def?: Def
  title?: string
  disabled?: boolean
  hidden?: boolean
  tooltip?: boolean
  placeholder?: string
  secret?: boolean
  [k: string]: unknown
}

type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData }
type ZuiSchema<S extends JSONSchema7, Def extends Partial<z.ZodDef> = {}> = S & {
  readOnly?: boolean
  default?: JsonData
  ['x-zui']?: util.Normalize<ZuiExtension<Def>>
}

export type StringSchema = ZuiSchema<{ type: 'string' }>
export type NumberSchema = ZuiSchema<{ type: 'number' }>
export type BigIntSchema = ZuiSchema<{ type: 'integer' }>
export type BooleanSchema = ZuiSchema<{ type: 'boolean' }>
export type DateSchema = ZuiSchema<{ type: 'string'; format: 'date-time' }>
export type NullSchema = ZuiSchema<{ type: 'null' }>
export type UndefinedSchema = ZuiSchema<{ not: true }, UndefinedDef>
export type NeverSchema = ZuiSchema<{ not: true }, NeverDef>
export type AnySchema = ZuiSchema<{}, AnyDef>
export type UnknownSchema = ZuiSchema<{}, UnknownDef>
export type ArraySchema = ZuiSchema<{ type: 'array'; items: ZuiJsonSchema }>
export type UnionSchema = ZuiSchema<{ anyOf: ZuiJsonSchema[] }, UnionDef>
export type DiscriminatedUnionSchema = ZuiSchema<{ anyOf: ZuiJsonSchema[] }, DiscriminatedUnionDef>
export type IntersectionSchema = ZuiSchema<{ allOf: [ZuiJsonSchema, ZuiJsonSchema] }>
export type MapSchema = ZuiSchema<{ type: 'object'; additionalProperties: ZuiJsonSchema }>
export type SetSchema = ZuiSchema<{ type: 'array'; items: ZuiJsonSchema; uniqueItems: true }>
export type EnumSchema = ZuiSchema<{ type: 'string'; enum: string[] }>
export type RefSchema = ZuiSchema<{ $ref: string }>
export type ObjectSchema = ZuiSchema<{
  type: 'object'
  properties: { [key: string]: ZuiJsonSchema }
  required: string[]
}>
export type TupleSchema = ZuiSchema<{ type: 'array'; items: ZuiJsonSchema[]; additionalItems: ZuiJsonSchema }>
export type RecordSchema = ZuiSchema<{ type: 'object'; additionalProperties: ZuiJsonSchema }>
export type LiteralStringSchema = ZuiSchema<{ type: 'string'; const: string }>
export type LiteralNumberSchema = ZuiSchema<{ type: 'number'; const: number }>
export type LiteralBooleanSchema = ZuiSchema<{ type: 'boolean'; const: boolean }>
export type LiteralBigIntSchema = ZuiSchema<{ type: 'integer'; const: number }>
export type LiteralNullSchema = ZuiSchema<{ type: 'null'; const: null }>

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
util.assertIs<JSONSchema7>(util.mock<ZuiSchema<{ type: 'invalid' }>>())
// @ts-expect-error
util.assertIs<JSONSchema7>(util.mock<ZuiSchema<{ $ref: number }>>())
