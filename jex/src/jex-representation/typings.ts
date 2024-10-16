import * as utils from '../utils'

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

export type JexStringLiteral<V extends string = string> = {
  type: 'string'
  value: V
}

export type JexNumberLiteral<V extends number = number> = {
  type: 'number'
  value: V
}

export type JexBooleanLiteral<V extends boolean = boolean> = {
  type: 'boolean'
  value: V
}

export type JexLiteral = JexStringLiteral | JexNumberLiteral | JexBooleanLiteral

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
  | JexStringLiteral
  | JexNumberLiteral
  | JexBooleanLiteral
  | JexUnion
  | JexObject
  | JexArray
  | JexMap
  | JexAny
  | JexTuple
