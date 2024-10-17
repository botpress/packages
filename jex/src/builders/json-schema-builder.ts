import { JSONSchema7 } from 'json-schema'

type PrimitiveType = string | number | boolean
type TypeOf<T extends PrimitiveType> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : never
const typeOf = <T extends PrimitiveType>(schema: T): TypeOf<T> => typeof schema as TypeOf<T>

type NoInfer<T> = [T][T extends any ? 0 : never]

const STRING = { type: 'string' } satisfies JSONSchema7
const NUMBER = { type: 'number' } satisfies JSONSchema7
const INTEGER = { type: 'integer' } satisfies JSONSchema7
const BOOLEAN = { type: 'boolean' } satisfies JSONSchema7
const NULL = { type: 'null' } satisfies JSONSchema7
const UNDEFINED = { not: {} } satisfies JSONSchema7
const UNKNOWN = {} satisfies JSONSchema7

export type jsonSchemaBuilder = typeof jsonSchemaBuilder
export const jsonSchemaBuilder = {
  string: () => STRING,
  number: () => NUMBER,
  integer: () => INTEGER,
  boolean: () => BOOLEAN,
  null: () => NULL,
  undefined: () => UNDEFINED,
  unknown: () => UNKNOWN,
  object: <K extends string>(
    properties: Record<K, JSONSchema7>,
    required: NoInfer<K>[] = Object.keys(properties) as K[]
  ) => ({
    type: 'object',
    properties,
    required
  }),
  array: (items: JSONSchema7) => ({ type: 'array', items }),
  tuple: (items: JSONSchema7[]) => ({ type: 'array', items, minItems: items.length, maxItems: items.length }),
  record: (values: JSONSchema7) => ({ type: 'object', additionalProperties: values }),
  union: <T extends JSONSchema7[]>(schemas: T) => ({ anyOf: schemas }),
  intersection: <T extends JSONSchema7[]>(schemas: T) => ({ allOf: schemas }),
  enum: <P extends string | number | boolean>(values: P[]) => ({ enum: values }),
  ref: ($ref: string) => ({ $ref }),
  date: () => ({ type: 'string', format: 'date-time' }),
  literal: (value: string | number | boolean) => ({ type: typeOf(value), enum: [value] }),
  nullable: (schema: JSONSchema7) => ({ anyOf: [schema, NULL] }),
  optional: (schema: JSONSchema7) => ({ anyOf: [schema, UNDEFINED] })
} satisfies Record<string, (...args: any[]) => JSONSchema7>
