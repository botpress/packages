export type JexIRStringContent = string
export type JexIRString = {
  type: 'string'
}

export type JexIRNumberContent = number
export type JexIRNumber = {
  type: 'number' // includes integer
}

export type JexIRBooleanContent = boolean
export type JexIRBoolean = {
  type: 'boolean'
}

export type JexIRPrimitive = JexIRString | JexIRNumber | JexIRBoolean

export type JexIRStringLiteral<V extends string = string> = {
  type: 'string'
  value: V
}

export type JexIRNumberLiteral<V extends number = number> = {
  type: 'number'
  value: V
}

export type JexIRBooleanLiteral<V extends boolean = boolean> = {
  type: 'boolean'
  value: V
}

export type JexIRLiteral = JexIRStringLiteral | JexIRNumberLiteral | JexIRBooleanLiteral

export type JexIRNull = {
  type: 'null'
}

export type JexIRUndefined = {
  type: 'undefined'
}

export type JexIRUnion = {
  type: 'union'
  anyOf: JexIR[]
}

export type JexIRObject = {
  type: 'object'
  properties: Record<string, JexIR> // properties are required
}

export type JexIRArray = {
  type: 'array'
  items: JexIR
}

export type JexIRMap = {
  type: 'map'
  items: JexIR
}

export type JexIRAny = {
  type: 'any'
}

export type JexIRTuple = {
  type: 'tuple'
  items: JexIR[]
}

/**
 * Jex Intermediate Representation;
 * This datastructure is simpler than a JSON Schema and easier to work with.
 * It has no requirement to be backward compatible since it is only used internally.
 */
export type JexIR =
  | JexIRPrimitive
  | JexIRNull
  | JexIRUndefined
  | JexIRStringLiteral
  | JexIRNumberLiteral
  | JexIRBooleanLiteral
  | JexIRUnion
  | JexIRObject
  | JexIRArray
  | JexIRMap
  | JexIRAny
  | JexIRTuple