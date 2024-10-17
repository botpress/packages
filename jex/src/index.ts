import * as jexir from './jexir'
import { JSONSchema7 } from 'json-schema'

import { jexEquals } from './jex-equals'
import { jexExtends, JexExtensionResult } from './jex-extends'
import { dereferenceJsonSchema } from './dereference'

export * as errors from './errors'

export type JSONSchema = JSONSchema7

export namespace sync {
  export const jsonSchemaEquals = (a: JSONSchema, b: JSONSchema): boolean => {
    let jexA = jexir.fromJsonSchema(a)
    let jexB = jexir.fromJsonSchema(b)
    jexA = jexir.normalize(jexA)
    jexB = jexir.normalize(jexB)
    return jexEquals(jexA, jexB)
  }

  export const jsonSchemaExtends = (a: JSONSchema, b: JSONSchema): JexExtensionResult => {
    let jexA = jexir.fromJsonSchema(a)
    let jexB = jexir.fromJsonSchema(b)
    jexA = jexir.normalize(jexA)
    jexB = jexir.normalize(jexB)
    return jexExtends(jexA, jexB)
  }
}

export const jsonSchemaEquals = async (a: JSONSchema, b: JSONSchema): Promise<boolean> => {
  const derefA = await dereferenceJsonSchema(a)
  const derefB = await dereferenceJsonSchema(b)
  return sync.jsonSchemaEquals(derefA, derefB)
}

export const jsonSchemaExtends = async (a: JSONSchema, b: JSONSchema): Promise<JexExtensionResult> => {
  const derefA = await dereferenceJsonSchema(a)
  const derefB = await dereferenceJsonSchema(b)
  return sync.jsonSchemaExtends(derefA, derefB)
}
