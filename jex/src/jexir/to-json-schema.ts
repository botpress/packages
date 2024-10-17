import { JSONSchema7 } from 'json-schema'
import * as utils from '../utils'
import * as types from './typings'

const isOptional = (jexir: types.JexIR): boolean =>
  jexir.type === 'union' && jexir.anyOf.some((jex) => jex.type === 'undefined')

export const toJsonSchema = (jexirSchema: types.JexIR): JSONSchema7 => {
  if (jexirSchema.type === 'null') {
    return { type: 'null' }
  }

  if (jexirSchema.type === 'undefined') {
    return { not: {} }
  }

  if (jexirSchema.type === 'string' || jexirSchema.type === 'number' || jexirSchema.type === 'boolean') {
    if ('value' in jexirSchema) {
      return { type: jexirSchema.type, const: jexirSchema.value }
    }
    return { type: jexirSchema.type }
  }

  if (jexirSchema.type === 'union') {
    return { anyOf: jexirSchema.anyOf.map(toJsonSchema) }
  }

  if (jexirSchema.type === 'intersection') {
    return { allOf: jexirSchema.allOf.map(toJsonSchema) }
  }

  if (jexirSchema.type === 'array') {
    return { type: 'array', items: toJsonSchema(jexirSchema.items) }
  }

  if (jexirSchema.type === 'map') {
    return { type: 'object', additionalProperties: toJsonSchema(jexirSchema.items) }
  }

  if (jexirSchema.type === 'object') {
    const entries = Object.entries(jexirSchema.properties)
    const requiredEntries = entries.filter(([_, jex]) => !isOptional(jex)).map(([k]) => k)
    return {
      type: 'object',
      properties: Object.fromEntries(entries.map(([k, v]) => [k, toJsonSchema(v)])),
      required: requiredEntries
    }
  }

  if (jexirSchema.type === 'tuple') {
    return { type: 'array', items: jexirSchema.items.map(toJsonSchema) }
  }

  // so that we don't forget anything
  type _expectPrimitive = utils.types.Expect<utils.types.Equals<typeof jexirSchema, types.JexIRUnknown>>
  return {}
}
