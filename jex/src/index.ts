import { JexError } from './errors'
import * as jexir from './jexir'
import { JSONSchema7 } from 'json-schema'

import { jexEquals } from './jex-equals'
import { jexExtends, JexExtensionResult } from './jex-extends'
import { jexMerge } from './jex-merge'

export * as errors from './errors'

export type JSONSchema = JSONSchema7

export const jsonSchemaEquals = async (a: JSONSchema, b: JSONSchema): Promise<boolean> => {
  const jexA = await jexir.fromJsonSchema(a)
  const jexB = await jexir.fromJsonSchema(b)
  return jexEquals(jexA, jexB)
}

export const jsonSchemaExtends = async (a: JSONSchema, b: JSONSchema): Promise<JexExtensionResult> => {
  const jexA = await jexir.fromJsonSchema(a)
  const jexB = await jexir.fromJsonSchema(b)
  return jexExtends(jexA, jexB)
}

export const jsonSchemaMerge = async (a: JSONSchema, b: JSONSchema): Promise<JSONSchema> => {
  const jexA = await jexir.fromJsonSchema(a)
  const jexB = await jexir.fromJsonSchema(b)

  if (jexA.type !== 'object' || jexB.type !== 'object') {
    throw new JexError('Both schemas must be objects to be merged')
  }

  const mergedJex = jexMerge(jexA, jexB)
  return jexir.toJsonSchema(mergedJex)
}
