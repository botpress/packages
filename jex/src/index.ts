import * as jex from './jex-representation'
import { JSONSchema7 } from 'json-schema'

export * as errors from './errors'

export const jsonSchemaEquals = async (a: JSONSchema7, b: JSONSchema7): Promise<boolean> => {
  const jexA = await jex.toJex(a)
  const jexB = await jex.toJex(b)
  return jex.jexEquals(jexA, jexB)
}

export const jsonSchemaExtends = async (child: JSONSchema7, parent: JSONSchema7): Promise<jex.JexExtensionResult> => {
  const jexChild = await jex.toJex(child)
  const jexParent = await jex.toJex(parent)
  return jex.jexExtends(jexChild, jexParent)
}
