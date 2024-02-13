import * as jex from './jex-representation'
import { JSONSchema7 } from 'json-schema'

export * as errors from './errors'

const failureReasonToString = (reason: jex.JexFailureReason, prefix = ''): string => {
  if (reason.child.length === 0) {
    return `${prefix}- ${reason.message}`
  }
  const childLines = reason.child.map((r) => failureReasonToString(r, `${prefix}  `)).join('\n')
  return `${prefix}- ${reason.message}:\n${childLines}`
}

export const jsonSchemaEquals = async (a: JSONSchema7, b: JSONSchema7): Promise<boolean> => {
  const jexA = await jex.toJex(a)
  const jexB = await jex.toJex(b)
  return jex.jexEquals(jexA, jexB)
}

type ExtensionResult = { extends: true } | { extends: false; reason: string }
export const jsonSchemaExtends = async (child: JSONSchema7, parent: JSONSchema7): Promise<ExtensionResult> => {
  const jexChild = await jex.toJex(child)
  const jexParent = await jex.toJex(parent)
  const res = jex.jexExtends(jexChild, jexParent)
  if (res.result) {
    return { extends: true }
  }
  return { extends: false, reason: failureReasonToString(res.reason) }
}
