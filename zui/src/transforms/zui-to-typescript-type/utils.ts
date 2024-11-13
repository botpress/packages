import { camelCase, deburr } from '../../ui/utils'

export function toTypescriptPrimitive(x: string | number | boolean | null | symbol | undefined | bigint): string {
  if (typeof x === 'undefined') {
    return 'undefined'
  }
  if (typeof x === 'symbol') {
    return `Symbol(${toTypescriptPrimitive(x.description)})`
  }
  if (typeof x === 'bigint') {
    const y: number = Number(x)
    return `BigInt(${y})`
  }
  return JSON.stringify(x)
}

export function toTypescriptValue(x: unknown): string {
  if (typeof x === 'undefined') {
    return 'undefined'
  }
  // will fail or not behave as expected if x contains a symbol or a bigint
  return JSON.stringify(x)
}

export const toPropertyKey = (key: string) => {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key
  }

  return toTypescriptPrimitive(key)
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export const toTypeArgumentName = (name: string) => {
  const nonAlphaNumeric = /[^a-zA-Z0-9_]/g
  const tokens = name
    .split(nonAlphaNumeric)
    .map(capitalize)
    .filter((t) => !!t)
  return tokens.join('')
}

export const getMultilineComment = (description?: string) => {
  const descLines = (description ?? '').split('\n').filter((l) => l.trim().length > 0)
  return descLines.length === 0
    ? ''
    : descLines.length === 1
      ? `/** ${descLines[0]} */`
      : `/**\n * ${descLines.join('\n * ')}\n */`
}

export const toValidFunctionName = (str: string) => {
  let name = deburr(str)
  name = name.replace(/[^a-zA-Z0-9_$]/g, '')

  if (!/^[a-zA-Z_$]/.test(name)) {
    name = `_${name}`
  }

  return camelCase(name)
}
