export type ValueOf<T> = T[keyof T]
import { JSONSchema7 } from 'json-schema'

// objects

const entries = <K extends string, V>(obj: Record<K, V>): [K, V][] => Object.entries(obj) as [K, V][]

export function filterObject<K extends string, V1, V2 extends V1>(
  obj: Record<K, V1>,
  fn: (v: V1, k: K) => v is V2,
): Record<K, V2>
export function filterObject<K extends string, V>(obj: Record<K, V>, fn: (v: V, k: K) => boolean): Record<K, V>
export function filterObject<K extends string, V>(obj: Record<K, V>, fn: (v: V, k: K) => boolean): Record<K, V> {
  const result: Record<K, V> = {} as Record<K, V>
  for (const [k, v] of entries(obj)) {
    if (fn(v, k)) {
      result[k] = v
    }
  }
  return result
}

// casing

const capitalizeFirstLetter = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
const splitHyphens = (tokens: string[]) => tokens.flatMap((token) => token.split('-'))
const splitUnderscores = (tokens: string[]) => tokens.flatMap((token) => token.split('_'))
const splitCaseChange = (tokens: string[]) => tokens.flatMap((token) => token.split(/(?<=[a-z])(?=[A-Z])/))
const splitTokens = (tokens: string[]) =>
  [splitHyphens, splitUnderscores, splitCaseChange].reduce((acc, step) => step(acc), tokens)

export const pascalCase = (text: string) => {
  const tokens = splitTokens([text])
  return tokens.map(capitalizeFirstLetter).join('')
}

// json-schema

type NoInfer<T> = [T][T extends any ? 0 : never]

type PrimitiveType = string | number | boolean
type TypeOf<T extends PrimitiveType> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : never
const typeOf = <T extends PrimitiveType>(schema: T): TypeOf<T> => typeof schema as TypeOf<T>

export type JsonSchemaBuilder = typeof jsonSchemaBuilder
export const jsonSchemaBuilder = {
  object: <K extends string>(
    properties: Record<K, JSONSchema7>,
    required: NoInfer<K>[] = Object.keys(properties) as K[],
  ) => ({
    type: 'object',
    properties,
    required,
  }),
  string: () => ({ type: 'string' }),
  number: () => ({ type: 'number' }),
  integer: () => ({ type: 'integer' }),
  boolean: () => ({ type: 'boolean' }),
  null: () => ({ type: 'null' }),
  array: (items: JSONSchema7) => ({ type: 'array', items }),
  tuple: (items: JSONSchema7[]) => ({ type: 'array', items }),
  record: (values: JSONSchema7) => ({ type: 'object', additionalProperties: values }),
  any: () => ({}),
  union: <T extends JSONSchema7[]>(...schemas: T) => ({ anyOf: schemas }),
  enum: <P extends string | number | boolean>(...values: P[]) => ({ enum: values }),
  ref: ($ref: string) => ({ $ref }),
  literal: (value: string | number | boolean) => ({ type: typeOf(value), enum: [value] }),
  nullable: (schema: JSONSchema7) => ({ anyOf: [schema, { type: 'null' }] }),
} satisfies Record<string, (...args: any[]) => JSONSchema7>
