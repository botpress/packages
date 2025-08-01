import { zuiKey } from '../../../ui/constants'
import type { ZodErrorMap } from '../error'
import type { ProcessedCreateParams, RawCreateParams } from '../index'

export namespace util {
  export type IsEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false

  export type isAny<T> = 0 extends 1 & T ? true : false
  export const assertEqual = <A, B>(val: IsEqual<A, B>) => val
  export function assertIs<T>(_arg: T): void {}
  export function assertNever(_x: never): never {
    throw new Error('assertNever called')
  }

  export type AssertNever<_T extends never> = true
  export type AssertTrue<_T extends true> = true

  export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
  export type OmitKeys<T, K extends string> = Pick<T, Exclude<keyof T, K>>
  export type MakePartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
  export type DeepPartialBoolean<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartialBoolean<T[K]> | boolean : boolean
  }

  export const arrayToEnum = <T extends string, U extends [T, ...T[]]>(items: U): { [k in U[number]]: k } => {
    const obj: { [k in U[number]]?: k } = {}
    for (const item of items) {
      obj[item] = item
    }
    return obj as { [k in U[number]]: k }
  }

  export const getValidEnumValues = (obj: any) => {
    const validKeys = objectKeys(obj).filter((k: any) => typeof obj[obj[k]] !== 'number')
    const filtered: any = {}
    for (const k of validKeys) {
      filtered[k] = obj[k]
    }
    return objectValues(filtered)
  }

  export const objectValues = (obj: any) => {
    return objectKeys(obj).map(function (e) {
      return obj[e]
    })
  }

  export const objectKeys: ObjectConstructor['keys'] =
    typeof Object.keys === 'function' // eslint-disable-line ban/ban
      ? (obj: any) => Object.keys(obj) // eslint-disable-line ban/ban
      : (object: any) => {
          const keys = []
          for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
              keys.push(key)
            }
          }
          return keys
        }

  export const find = <T>(arr: T[], checker: (arg: T) => any): T | undefined => {
    for (const item of arr) {
      if (checker(item)) return item
    }
    return undefined
  }

  export type identity<T> = objectUtil.identity<T>
  export type flatten<T> = objectUtil.flatten<T>

  export type noUndefined<T> = T extends undefined ? never : T

  export const isInteger: NumberConstructor['isInteger'] =
    typeof Number.isInteger === 'function'
      ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
      : (val) => typeof val === 'number' && isFinite(val) && Math.floor(val) === val

  export function joinValues<T extends any[]>(array: T, separator = ' | '): string {
    return array.map((val) => (typeof val === 'string' ? `'${val}'` : val)).join(separator)
  }

  export const jsonStringifyReplacer = (_: string, value: any): any => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }

  export const compareFunctions = (a: Function, b: Function) => {
    /**
     * The only proper way to deeply compare functions would be to ensure they return the same value for the same input.
     * This is impossible to do unless the domain of the function is known and the function is pure.
     *
     * Comparing source code is not ideal since 2 function could be equivalent but have different source code,
     * but that's our best option.
     */
    return a.toString() === b.toString()
  }

  export const mock = <T>(): T => ({}) as T

  export type Satisfies<X extends Y, Y> = X

  type NormalizeObject<T extends object> = T extends infer O ? { [K in keyof O]: Normalize<O[K]> } : never
  export type Normalize<T> = T extends (...args: infer A) => infer R
    ? (...args: Normalize<A>) => Normalize<R>
    : T extends Array<infer E>
      ? Array<Normalize<E>>
      : T extends ReadonlyArray<infer E>
        ? ReadonlyArray<Normalize<E>>
        : T extends Promise<infer R>
          ? Promise<Normalize<R>>
          : T extends Buffer
            ? Buffer
            : T extends object
              ? NormalizeObject<T>
              : T
}

export namespace objectUtil {
  export type MergeShapes<U, V> = {
    [k in Exclude<keyof U, keyof V>]: U[k]
  } & V

  type optionalKeys<T extends object> = {
    [k in keyof T]: undefined extends T[k] ? k : never
  }[keyof T]

  type requiredKeys<T extends object> = {
    [k in keyof T]: undefined extends T[k] ? never : k
  }[keyof T]

  export type addQuestionMarks<
    T extends object,
    R extends keyof T = requiredKeys<T>,
    O extends keyof T = optionalKeys<T>,
  > = Pick<T, R> & Partial<Pick<T, O>> & { [k in keyof T]?: unknown }

  export type identity<T> = T
  export type flatten<T> = identity<{ [k in keyof T]: T[k] }>

  export type noNeverKeys<T> = {
    [k in keyof T]: [T[k]] extends [never] ? never : k
  }[keyof T]

  export type noNever<T> = identity<{
    [k in noNeverKeys<T>]: k extends keyof T ? T[k] : never
  }>

  export const mergeShapes = <U, T>(first: U, second: T): T & U => {
    return {
      ...first,
      ...second, // second overwrites first
    }
  }

  export type extendShape<A, B> = flatten<Omit<A, keyof B> & B>
}

export const ZodParsedType = util.arrayToEnum([
  'string',
  'nan',
  'number',
  'integer',
  'float',
  'boolean',
  'date',
  'bigint',
  'symbol',
  'function',
  'undefined',
  'null',
  'array',
  'object',
  'unknown',
  'promise',
  'void',
  'never',
  'map',
  'set',
])

export type ZodParsedType = keyof typeof ZodParsedType

export const getParsedType = (data: any): ZodParsedType => {
  const t = typeof data

  switch (t) {
    case 'undefined':
      return ZodParsedType.undefined

    case 'string':
      return ZodParsedType.string

    case 'number':
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number

    case 'boolean':
      return ZodParsedType.boolean

    case 'function':
      return ZodParsedType.function

    case 'bigint':
      return ZodParsedType.bigint

    case 'symbol':
      return ZodParsedType.symbol

    case 'object':
      if (Array.isArray(data)) {
        return ZodParsedType.array
      }
      if (data === null) {
        return ZodParsedType.null
      }
      if (data.then && typeof data.then === 'function' && data.catch && typeof data.catch === 'function') {
        return ZodParsedType.promise
      }
      if (typeof Map !== 'undefined' && data instanceof Map) {
        return ZodParsedType.map
      }
      if (typeof Set !== 'undefined' && data instanceof Set) {
        return ZodParsedType.set
      }
      if (typeof Date !== 'undefined' && data instanceof Date) {
        return ZodParsedType.date
      }
      return ZodParsedType.object

    default:
      return ZodParsedType.unknown
  }
}

export function processCreateParams(
  params: RawCreateParams & ({ supportsExtensions?: 'secret'[] } | undefined),
): ProcessedCreateParams {
  if (!params) return {}

  const {
    errorMap,
    invalid_type_error,
    required_error,
    description,
    supportsExtensions,
    [zuiKey]: zuiExtensions,
  } = params

  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`)
  }

  const filteredZuiExtensions = zuiExtensions
    ? Object.fromEntries(
        Object.entries(zuiExtensions).filter(([key]) => key !== 'secret' || supportsExtensions?.includes('secret')),
      )
    : undefined

  if (errorMap) return { errorMap: errorMap, description, [zuiKey]: filteredZuiExtensions }

  const customMap: ZodErrorMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return { message: ctx.defaultError }
    if (typeof ctx.data === 'undefined') {
      return { message: required_error ?? ctx.defaultError }
    }
    return { message: invalid_type_error ?? ctx.defaultError }
  }
  return { errorMap: customMap, description, [zuiKey]: filteredZuiExtensions }
}
