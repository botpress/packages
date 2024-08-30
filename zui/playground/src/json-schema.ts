import { JSONSchema7 } from 'json-schema'
import { BaseSchema as _BaseSchema } from '../../src/json-schema'
import { util } from '../../src/z/types/utils'

export type BaseSchema = _BaseSchema & {
  anyOf?: JSONSchema[]
  oneOf?: JSONSchema[]
  allOf?: JSONSchema[]
  not?: JSONSchema
}

export type JSONSchemaPrimitiveType = 'string' | 'number' | 'integer' | 'boolean' | 'null'

type BaseArraySchema = BaseSchema & {
  type: 'array'
  default?: any[]
}

export type ArraySchema = BaseArraySchema & {
  items: JSONSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minContains?: number
  maxContains?: number
}

export type TupleSchema = BaseArraySchema & {
  items: JSONSchema[]
}

type BaseObjectSchema = BaseSchema & {
  type: 'object'
  required?: string[]
  default?: any
  maxProperties?: number
  minProperties?: number
  dependentRequired?: {
    [key: string]: string[]
  }
}

export type ObjectSchema = BaseObjectSchema & {
  properties: Record<string, JSONSchema>
  additionalProperties?: false
}

export type RecordSchema = BaseObjectSchema & {
  properties?: undefined
  additionalProperties: JSONSchema
}

// https://json-schema.org/understanding-json-schema/reference/string#built-in-formats
export type Formats =
  | 'date-time'
  | 'time'
  | 'date'
  | 'duration'
  | 'email'
  | 'idn-email'
  | 'hostname'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uuid'
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  | 'uri-template'
  | 'json-pointer'
  | 'relative-json-pointer'
  | 'regex'

export type StringSchema = {
  type: 'string'
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: Formats
  default?: string
} & BaseSchema

export type NumberSchema = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  multipleOf?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  enum?: number[]
  default?: number
} & BaseSchema

export type BooleanSchema = {
  type: 'boolean'
  enum?: boolean[]
  default?: boolean
} & BaseSchema

export type NullSchema = {
  type: 'null'
  default?: null
} & BaseSchema

export type AnySchema = {
  type?: undefined
  default?: any
} & BaseSchema

// more complete type for JSONSchema
export type PrimitiveSchema = StringSchema | NumberSchema | BooleanSchema | NullSchema | AnySchema
export type JSONSchema = PrimitiveSchema | ArraySchema | ObjectSchema | RecordSchema | TupleSchema

util.assertExtends<JSONSchema, JSONSchema7>(true) // ensure that JSONSchema is a subset of JSONSchema7

type Cast<T, U> = T extends U ? T : U

type TupleTree = { head?: any; tail?: TupleTree }
type BuildTupleTree<T extends TupleSchema> = T extends { items: [infer A, ...infer B] }
  ? {
      head: TypeOf<Cast<A, JSONSchema>>
      tail: BuildTupleTree<{ type: 'array'; items: Cast<B, JSONSchema[]> }>
    }
  : T extends { items: [infer A] }
    ? { head: TypeOf<Cast<A, JSONSchema>> }
    : {}

type ParseTupleTree<T extends TupleTree> = T extends { head: infer A; tail: infer B }
  ? [A, ...ParseTupleTree<Cast<B, TupleTree>>]
  : T extends { head: infer A }
    ? [A]
    : []

export type StringTypeOf<T extends StringSchema> = T['enum'] extends string[] ? T['enum'][number] : string
export type NumberTypeOf<T extends NumberSchema> = T['enum'] extends number[] ? T['enum'][number] : number
export type BooleanTypeOf<T extends BooleanSchema> = T['enum'] extends boolean[] ? T['enum'][number] : boolean
export type TupleTypeOf<T extends TupleSchema> = ParseTupleTree<BuildTupleTree<T>>
export type TypeOf<T extends JSONSchema> = T extends StringSchema
  ? StringTypeOf<T>
  : T extends NumberSchema
    ? NumberTypeOf<T>
    : T extends BooleanSchema
      ? BooleanTypeOf<T>
      : T extends NullSchema
        ? null
        : T extends ArraySchema
          ? TypeOf<T['items']>[]
          : T extends TupleSchema
            ? TupleTypeOf<T>
            : T extends ObjectSchema
              ? { [K in keyof T['properties']]: TypeOf<T['properties'][K]> }
              : T extends RecordSchema
                ? Record<string, TypeOf<T['additionalProperties']>>
                : any

type TupleActual = TypeOf<{
  type: 'array'
  items: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'string'; enum: ['allo', 'bonjour'] },
    { type: 'number'; enum: [42, 666] },
    { type: 'boolean'; enum: [true] },
  ]
}>
type TupleExpected = [string, number, boolean, 'allo' | 'bonjour', 42 | 666, true]
util.assertEqual<TupleActual, TupleExpected>(true)

type ObjectActual = TypeOf<{
  type: 'object'
  properties: {
    a: { type: 'string' }
    b: { type: 'number' }
    c: { type: 'boolean' }
    d: { type: 'string'; enum: ['allo', 'bonjour'] }
    e: { type: 'number'; enum: [42, 666] }
    f: { type: 'boolean'; enum: [true] }
  }
}>
type ObjectExpected = { a: string; b: number; c: boolean; d: 'allo' | 'bonjour'; e: 42 | 666; f: true }
util.assertEqual<ObjectActual, ObjectExpected>(true)
