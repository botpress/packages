import { JexError } from './errors'
import * as jex from './jex-representation'
import { JSONSchema7 } from 'json-schema'

export * as errors from './errors'

export type JSONSchema = JSONSchema7

export const jsonSchemaEquals = async (a: JSONSchema, b: JSONSchema): Promise<boolean> => {
  const jexA = await jex.toJex(a)
  const jexB = await jex.toJex(b)
  return jex.jexEquals(jexA, jexB)
}

export const jsonSchemaExtends = async (a: JSONSchema, b: JSONSchema): Promise<jex.JexExtensionResult> => {
  const jexA = await jex.toJex(a)
  const jexB = await jex.toJex(b)
  return jex.jexExtends(jexA, jexB)
}

export const jsonSchemaMerge = async (a: JSONSchema, b: JSONSchema): Promise<JSONSchema> => {
  const jexA = await jex.toJex(a)
  const jexB = await jex.toJex(b)

  if (jexA.type !== 'object' || jexB.type !== 'object') {
    throw new JexError('Both schemas must be objects to be merged')
  }

  const mergedJex = jex.jexMerge(jexA, jexB)
  return jex.fromJex(mergedJex)
}
