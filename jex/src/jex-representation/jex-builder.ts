import * as types from './typings'

type TypeOf<T extends string | number | boolean> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : never

type TupleOf<T extends any> =
  | [T, T]
  | [T, T, T]
  | [T, T, T, T]
  | [T, T, T, T, T]
  | [T, T, T, T, T, T]
  | [T, T, T, T, T, T, T]
  | [T, T, T, T, T, T, T, T]
  | [T, T, T, T, T, T, T, T, T]
  | [T, T, T, T, T, T, T, T, T, T] // 10

function _literal<T extends string>(value: T): types.JexLiteral<types.JexString>
function _literal<T extends number>(value: T): types.JexLiteral<types.JexNumber>
function _literal<T extends boolean>(value: T): types.JexLiteral<types.JexBoolean>
function _literal(value: string | number | boolean) {
  return { type: typeof value as TypeOf<typeof value>, value }
}

export type $ = typeof $
export const $ = {
  any: () => ({ type: 'any' }) satisfies types.JexType,
  string: () => ({ type: 'string' }) satisfies types.JexType,
  number: () => ({ type: 'number' }) satisfies types.JexType,
  boolean: () => ({ type: 'boolean' }) satisfies types.JexType,
  null: () => ({ type: 'null' }) satisfies types.JexType,
  undefined: () => ({ type: 'undefined' }) satisfies types.JexType,
  literal: _literal,
  object: (properties: Record<string, types.JexType>) => ({ type: 'object', properties }) satisfies types.JexType,
  array: (items: types.JexType) => ({ type: 'array', items }) satisfies types.JexType,
  map: (items: types.JexType) => ({ type: 'map', items }) satisfies types.JexType,
  tuple: (items: types.JexType[]) => ({ type: 'tuple', items }) satisfies types.JexType,
  union: (anyOf: TupleOf<types.JexType>) => ({ type: 'union', anyOf }) satisfies types.JexType
}
