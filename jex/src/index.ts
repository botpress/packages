import * as jex from './jex-representation'
import { JSONSchema7 } from 'json-schema'

export * as errors from './errors'

export const jsonSchemaEquals = (a: JSONSchema7, b: JSONSchema7): boolean => {
  const jexA = jex.toJex(a)
  const jexB = jex.toJex(b)
  return jex.jexEquals(jexA, jexB)
}

export const jsonSchemaExtends = (child: JSONSchema7, parent: JSONSchema7): boolean => {
  const jexChild = jex.toJex(child)
  const jexParent = jex.toJex(parent)
  return jex.jexExtends(jexChild, jexParent)
}
