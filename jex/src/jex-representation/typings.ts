/**
 * Internal representation of Jex Schema
 * Simpler than JSON Schema and capable of representing all TypeScript types
 */

export type JexStringContent = string
export type JexString = {
  type: 'string'
}

export type JexNumberContent = number
export type JexNumber = {
  type: 'number' // includes integer
}

export type JexBooleanContent = boolean
export type JexBoolean = {
  type: 'boolean'
}

export type JexPrimitive = JexString | JexNumber | JexBoolean

export type JexPrimitives = {
  string: JexString
  number: JexNumber
  boolean: JexBoolean
}

export type JexPrimitiveContents = {
  string: JexStringContent
  number: JexNumberContent
  boolean: JexBooleanContent
}

export type JexLiteral<T extends JexPrimitive = JexPrimitive> = {
  type: T['type']
  value: JexPrimitiveContents[T['type']] // instead of enum
}

export type JexNull = {
  type: 'null'
}

export type JexUndefined = {
  type: 'undefined'
}

export type JexUnion = {
  type: 'union'
  anyOf: JexType[]
}

export type JexObject = {
  type: 'object'
  properties: Record<string, JexType> // properties are required
}

export type JexArray = {
  type: 'array'
  items: JexType
}

export type JexMap = {
  type: 'map'
  items: JexType
}

export type JexAny = {
  type: 'any'
}

export type JexTuple = {
  type: 'tuple'
  items: JexType[]
}

export type JexType =
  | JexPrimitive
  | JexNull
  | JexUndefined
  | JexLiteral
  | JexUnion
  | JexObject
  | JexArray
  | JexMap
  | JexAny
  | JexTuple
