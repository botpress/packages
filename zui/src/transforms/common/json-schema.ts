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
  { typeName: z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion; discriminator: string },
  Partial<z.ZodDiscriminatedUnionDef>
>
type UndefinedDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUndefined }, Partial<z.ZodUndefinedDef>>
type NeverDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodNever }, Partial<z.ZodNeverDef>>
type AnyDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodAny }, Partial<z.ZodAnyDef>>
type UnknownDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUnknown }, Partial<z.ZodUnknownDef>>

/**
 * ZuiExtension:
 *
 * Metadata that is not part of the JSON schema spec
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

/**
 * ZuiJsonSchema:
 *
 * A ZUI flavored subset of JSONSchema7
 */

type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData }
type BaseZuiJsonSchema<Def extends Partial<z.ZodDef> = {}> = {
  readOnly?: boolean
  default?: JsonData
  ['x-zui']?: util.Normalize<ZuiExtension<Def>>
}

export type StringSchema = { type: 'string' } & BaseZuiJsonSchema
export type NumberSchema = { type: 'number' } & BaseZuiJsonSchema
export type BigIntSchema = { type: 'integer' } & BaseZuiJsonSchema
export type BooleanSchema = { type: 'boolean' } & BaseZuiJsonSchema
export type DateSchema = { type: 'string'; format: 'date-time' } & BaseZuiJsonSchema
export type NullSchema = { type: 'null' } & BaseZuiJsonSchema
export type UndefinedSchema = { not: true } & BaseZuiJsonSchema<UndefinedDef>
export type NeverSchema = { not: true } & BaseZuiJsonSchema<NeverDef>
export type AnySchema = {} & BaseZuiJsonSchema<AnyDef>
export type UnknownSchema = {} & BaseZuiJsonSchema<UnknownDef>
export type ArraySchema = { type: 'array'; items: ZuiJsonSchema } & BaseZuiJsonSchema
export type UnionSchema = { anyOf: ZuiJsonSchema[] } & BaseZuiJsonSchema<UnionDef>
export type DiscriminatedUnionSchema = { anyOf: ZuiJsonSchema[] } & BaseZuiJsonSchema<DiscriminatedUnionDef>
export type IntersectionSchema = { allOf: [ZuiJsonSchema, ZuiJsonSchema] } & BaseZuiJsonSchema
export type MapSchema = { type: 'object'; additionalProperties: ZuiJsonSchema } & BaseZuiJsonSchema
export type SetSchema = { type: 'array'; items: ZuiJsonSchema; uniqueItems: true } & BaseZuiJsonSchema
export type EnumSchema = { type: 'string'; enum: string[] } & BaseZuiJsonSchema
export type RefSchema = { $ref: string } & BaseZuiJsonSchema
export type ObjectSchema = {
  type: 'object'
  properties: { [key: string]: ZuiJsonSchema }
  required: string[]
} & BaseZuiJsonSchema
export type TupleSchema = { type: 'array'; items: ZuiJsonSchema[]; additionalItems: ZuiJsonSchema } & BaseZuiJsonSchema
export type RecordSchema = { type: 'object'; additionalProperties: ZuiJsonSchema } & BaseZuiJsonSchema
export type LiteralStringSchema = { type: 'string'; const: string } & BaseZuiJsonSchema
export type LiteralNumberSchema = { type: 'number'; const: number } & BaseZuiJsonSchema
export type LiteralBooleanSchema = { type: 'boolean'; const: boolean } & BaseZuiJsonSchema
export type LiteralBigIntSchema = { type: 'integer'; const: number } & BaseZuiJsonSchema
export type LiteralNullSchema = { type: 'null'; const: null } & BaseZuiJsonSchema

export type LiteralSchema =
  | LiteralStringSchema
  | LiteralNumberSchema
  | LiteralBooleanSchema
  | LiteralBigIntSchema
  | LiteralNullSchema

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

/**
 * Tests:
 *
 * Ensure that all ZuiJsonSchema types are assignable to JSONSchema7
 */

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
util.assertIs<JSONSchema7>(util.mock<{ type: 'invalid' }>())
// @ts-expect-error
util.assertIs<JSONSchema7>(util.mock<{ $ref: number }>())
