import { JSONSchema7 } from 'json-schema'
import { util } from '../../z/types/utils'
import z from '../../z'
import { ZuiExtensionObject } from '../../ui/types'

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
 * ZuiJsonSchema:
 *
 * A ZUI flavored subset of JSONSchema7
 */

type ZuiExtension<Def extends Partial<z.ZodDef> = {}> = { def?: Def } & ZuiExtensionObject
type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData }
type BaseZuiJsonSchema<Def extends Partial<z.ZodDef> = {}> = util.Satisfies<
  {
    readOnly?: boolean
    default?: JsonData
    ['x-zui']?: ZuiExtension<Def>
  },
  JSONSchema7
>

type _StringSchema = util.Satisfies<{ type: 'string' }, JSONSchema7>
type _NumberSchema = util.Satisfies<{ type: 'number' }, JSONSchema7>
type _BigIntSchema = util.Satisfies<{ type: 'integer' }, JSONSchema7>
type _BooleanSchema = util.Satisfies<{ type: 'boolean' }, JSONSchema7>
type _DateSchema = util.Satisfies<{ type: 'string'; format: 'date-time' }, JSONSchema7>
type _NullSchema = util.Satisfies<{ type: 'null' }, JSONSchema7>
type _UndefinedSchema = util.Satisfies<{ not: true }, JSONSchema7>
type _NeverSchema = util.Satisfies<{ not: true }, JSONSchema7>
type _AnySchema = util.Satisfies<{}, JSONSchema7>
type _UnknownSchema = util.Satisfies<{}, JSONSchema7>
type _ArraySchema = util.Satisfies<{ type: 'array'; items: ZuiJsonSchema }, JSONSchema7>
type _UnionSchema = util.Satisfies<{ anyOf: ZuiJsonSchema[] }, JSONSchema7>
type _DiscriminatedUnionSchema = util.Satisfies<{ anyOf: ZuiJsonSchema[] }, JSONSchema7>
type _IntersectionSchema = util.Satisfies<{ allOf: [ZuiJsonSchema, ZuiJsonSchema] }, JSONSchema7>
type _SetSchema = util.Satisfies<{ type: 'array'; items: ZuiJsonSchema; uniqueItems: true }, JSONSchema7>
type _EnumSchema = util.Satisfies<{ type: 'string'; enum: string[] }, JSONSchema7>
type _RefSchema = util.Satisfies<{ $ref: string }, JSONSchema7>
type _ObjectSchema = util.Satisfies<
  { type: 'object'; properties: { [key: string]: ZuiJsonSchema }; required: string[] },
  JSONSchema7
>
type _TupleSchema = util.Satisfies<
  { type: 'array'; items: ZuiJsonSchema[]; additionalItems?: ZuiJsonSchema },
  JSONSchema7
>
type _RecordSchema = util.Satisfies<{ type: 'object'; additionalProperties: ZuiJsonSchema }, JSONSchema7>
type _LiteralStringSchema = util.Satisfies<{ type: 'string'; const: string }, JSONSchema7>
type _LiteralNumberSchema = util.Satisfies<{ type: 'number'; const: number }, JSONSchema7>
type _LiteralBooleanSchema = util.Satisfies<{ type: 'boolean'; const: boolean }, JSONSchema7>
type _LiteralBigIntSchema = util.Satisfies<{ type: 'integer'; const: number }, JSONSchema7>
type _LiteralNullSchema = util.Satisfies<{ type: 'null'; const: null }, JSONSchema7>
type _OptionalSchema = util.Satisfies<{ anyOf: [ZuiJsonSchema, UndefinedSchema] }, JSONSchema7>
type _NullableSchema = util.Satisfies<{ anyOf: [ZuiJsonSchema, NullSchema] }, JSONSchema7>

export type StringSchema = _StringSchema & BaseZuiJsonSchema
export type NumberSchema = _NumberSchema & BaseZuiJsonSchema
export type BigIntSchema = _BigIntSchema & BaseZuiJsonSchema
export type BooleanSchema = _BooleanSchema & BaseZuiJsonSchema
export type DateSchema = _DateSchema & BaseZuiJsonSchema
export type NullSchema = _NullSchema & BaseZuiJsonSchema
export type UndefinedSchema = _UndefinedSchema & BaseZuiJsonSchema<UndefinedDef>
export type NeverSchema = _NeverSchema & BaseZuiJsonSchema<NeverDef>
export type AnySchema = _AnySchema & BaseZuiJsonSchema<AnyDef>
export type UnknownSchema = _UnknownSchema & BaseZuiJsonSchema<UnknownDef>
export type ArraySchema = _ArraySchema & BaseZuiJsonSchema
export type UnionSchema = _UnionSchema & BaseZuiJsonSchema<UnionDef>
export type DiscriminatedUnionSchema = _DiscriminatedUnionSchema & BaseZuiJsonSchema<DiscriminatedUnionDef>
export type IntersectionSchema = _IntersectionSchema & BaseZuiJsonSchema
export type SetSchema = _SetSchema & BaseZuiJsonSchema
export type EnumSchema = _EnumSchema & BaseZuiJsonSchema
export type RefSchema = _RefSchema & BaseZuiJsonSchema
export type ObjectSchema = _ObjectSchema & BaseZuiJsonSchema
export type TupleSchema = _TupleSchema & BaseZuiJsonSchema
export type RecordSchema = _RecordSchema & BaseZuiJsonSchema
export type LiteralStringSchema = _LiteralStringSchema & BaseZuiJsonSchema
export type LiteralNumberSchema = _LiteralNumberSchema & BaseZuiJsonSchema
export type LiteralBooleanSchema = _LiteralBooleanSchema & BaseZuiJsonSchema
export type LiteralBigIntSchema = _LiteralBigIntSchema & BaseZuiJsonSchema
export type LiteralNullSchema = _LiteralNullSchema & BaseZuiJsonSchema
export type OptionalSchema = _OptionalSchema & BaseZuiJsonSchema
export type NullableSchema = _NullableSchema & BaseZuiJsonSchema

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
  | SetSchema
  | LiteralSchema
  | EnumSchema
  | RefSchema
  | OptionalSchema
  | NullableSchema
