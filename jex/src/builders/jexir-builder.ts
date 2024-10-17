import * as jexir from '../jexir'

type TypeOf<T extends string | number | boolean> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : never

function _literal<T extends string>(value: T): jexir.JexIRStringLiteral<T>
function _literal<T extends number>(value: T): jexir.JexIRNumberLiteral<T>
function _literal<T extends boolean>(value: T): jexir.JexIRBooleanLiteral<T>
function _literal(value: string | number | boolean) {
  return { type: typeof value as TypeOf<typeof value>, value }
}

export type jexirBuilder = typeof jexirBuilder
export const jexirBuilder = {
  unknown: () => ({ type: 'unknown' }),
  string: () => ({ type: 'string' }),
  number: () => ({ type: 'number' }),
  boolean: () => ({ type: 'boolean' }),
  null: () => ({ type: 'null' }),
  undefined: () => ({ type: 'undefined' }),
  literal: _literal,
  object: <Args extends Record<string, jexir.JexIR>>(properties: Args) => ({ type: 'object', properties }),
  array: <const Args extends jexir.JexIR>(items: Args) => ({ type: 'array', items: items as Args }),
  map: <const Args extends jexir.JexIR>(items: Args) => ({ type: 'map', items: items as Args }),
  tuple: <const Args extends jexir.JexIR[]>(items: Args) => ({ type: 'tuple', items }),
  union: <const Args extends jexir.JexIR[]>(anyOf: Args) => ({ type: 'union', anyOf }),
  intersection: <const Args extends jexir.JexIR[]>(allOf: Args) => ({ type: 'intersection', allOf })
} satisfies Record<string, (...args: any[]) => jexir.JexIR>
