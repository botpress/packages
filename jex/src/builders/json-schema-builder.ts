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

export type JsonSchemaBuilder = typeof jsonSchemaBuilder
export const jsonSchemaBuilder = {
  object: <K extends string>(
    properties: Record<K, JSONSchema7>,
    required: NoInfer<K>[] = Object.keys(properties) as K[]
  ) => ({
    type: 'object',
    properties,
    required
  }),
  string: () => ({ type: 'string' }),
  number: () => ({ type: 'number' }),
  integer: () => ({ type: 'integer' }),
  boolean: () => ({ type: 'boolean' }),
  null: () => ({ type: 'null' }),
  array: (items: JSONSchema7) => ({ type: 'array', items }),
  tuple: (items: JSONSchema7[]) => ({ type: 'array', items, minItems: items.length, maxItems: items.length }),
  record: (values: JSONSchema7) => ({ type: 'object', additionalProperties: values }),
  any: () => ({}),
  union: <T extends JSONSchema7[]>(...schemas: T) => ({ anyOf: schemas }),
  enum: <P extends string | number | boolean>(...values: P[]) => ({ enum: values }),
  ref: ($ref: string) => ({ $ref }),
  literal: (value: string | number | boolean) => ({ type: typeOf(value), enum: [value] }),
  nullable: (schema: JSONSchema7) => ({ anyOf: [schema, { type: 'null' }] }),
  intersection: <T extends JSONSchema7[]>(...schemas: T) => ({ allOf: schemas })
} satisfies Record<string, (...args: any[]) => JSONSchema7>
