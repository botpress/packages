import { Primitive } from '../../z'

/**
 * @returns a valid typescript literal type usable in `type MyType = ${x}`
 */
export function primitiveToTypscriptLiteralType(x: Primitive): string {
  if (typeof x === 'symbol') {
    return 'symbol' // there's no way to represent a symbol literal in a single line with typescript
  }
  if (typeof x === 'bigint') {
    const str = x.toString()
    return `${str}n`
  }
  return primitiveToTypescriptValue(x)
}

/**
 * @returns a valid typescript primitive value usable in `const myValue = ${x}`
 */
export function primitiveToTypescriptValue(x: Primitive): string {
  if (typeof x === 'undefined') {
    return 'undefined'
  }
  if (typeof x === 'symbol') {
    if (x.description) {
      return `Symbol(${primitiveToTypescriptValue(x.description)})`
    }
    return 'Symbol()'
  }
  if (typeof x === 'bigint') {
    const str = x.toString()
    return `BigInt(${str})`
  }
  if (typeof x === 'string') {
    return escapeString(x)
  }

  return JSON.stringify(x)
}

/**
 * @returns a valid typescript value usable in `const myValue = ${x}`
 */
export function unknownToTypescriptValue(x: unknown): string {
  if (typeof x === 'undefined') {
    return 'undefined'
  }
  // will fail or not behave as expected if x contains a symbol or a bigint
  return JSON.stringify(x)
}

/**
 * @returns a valid typescript value usable in `const myValue = ${x}`
 */
export const arrayOfUnknownToTypescriptArray = (arr: Primitive[], asConst?: boolean) => {
  const maybeAsConst = asConst ? ' as const' : ''

  return `[ ${arr.map(unknownToTypescriptValue).join(', ')} ]${maybeAsConst}`
}

/**
 * @returns a valid typescript value usable in `const myValue = ${x}`
 */
export const recordOfUnknownToTypescriptRecord = (
  record: Record<string | number | symbol, unknown>,
  asConst?: boolean,
) => {
  const entries = Object.entries(record)
  const maybeAsConst = asConst ? ' as const' : ''

  return `{ ${entries
    .map(([key, value]) => `${toPropertyKey(key)}: ${unknownToTypescriptValue(value)}`)
    .join(', ')} }${maybeAsConst}`
}

export const toPropertyKey = (key: string) => {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key
  }

  return primitiveToTypescriptValue(key)
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

const trimEmptyLinesInPlace = (lines: string[]) => {
  while (lines.length && !lines[0]?.trim()) {
    lines.shift()
  }

  while (lines.length && !lines[lines.length - 1]!.trim()) {
    lines.pop()
  }
}

export const getMultilineComment = (description?: string) => {
  // Remove too many empty lines (more than 2)
  description = description?.replace(/(\n(\s*)?){3,}/g, '\n\n')

  const ensureLineStartsWithAsterisk = (line: string) => (line.startsWith('* ') ? ` ${line}` : ` * ${line}`)
  const escapeCommentEnd = (line: string) => line.replace(/\*\//g, '*\\/')

  const descLines = (description ?? '').split('\n').map((line) => line.trim())

  trimEmptyLinesInPlace(descLines)

  if (descLines.length) {
    descLines[0] = descLines[0]!.replace(/^\/\*\*?/, '')
    descLines[descLines.length - 1] = descLines[descLines.length - 1]!.replace(/\*\/$/, '')
  }

  trimEmptyLinesInPlace(descLines)

  return descLines.length === 0
    ? ''
    : descLines.length === 1
      ? `/** ${escapeCommentEnd(descLines[0]!)} */`
      : `/**\n${descLines.map(ensureLineStartsWithAsterisk).map(escapeCommentEnd).join('\n')}\n */`
}

export function escapeString(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  // Use String.raw to get the raw string with escapes preserved
  const rawStr = String.raw`${str}`

  // Escape newlines and other special characters
  const escapedStr = rawStr.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, "\\'")

  // Determine the appropriate quote style
  if (escapedStr.includes('`')) {
    return `"${escapedStr}"`
  } else if (escapedStr.includes("'")) {
    return `"${escapedStr}"`
  } else {
    return `'${escapedStr}'`
  }
}
