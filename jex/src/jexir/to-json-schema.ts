import { JSONSchema7 } from 'json-schema'
import * as types from './typings'

const isOptional = (jexir: types.JexIR): boolean =>
  jexir.type === 'union' && jexir.anyOf.some((jex) => jex.type === 'undefined')

export const toJsonSchema = (jex: types.JexIR): JSONSchema7 => {
  if (jex.type === 'null') {
    return { type: 'null' }
  }

  if (jex.type === 'undefined') {
    return { not: {} }
  }

  if (jex.type === 'string' || jex.type === 'number' || jex.type === 'boolean') {
    if ('value' in jex) {
      return { type: jex.type, const: jex.value }
    }
    return { type: jex.type }
  }

  if (jex.type === 'union') {
    return { anyOf: jex.anyOf.map(toJsonSchema) }
  }

  if (jex.type === 'intersection') {
    return { allOf: jex.allOf.map(toJsonSchema) }
  }

  if (jex.type === 'array') {
    return { type: 'array', items: toJsonSchema(jex.items) }
  }

  if (jex.type === 'map') {
    return { type: 'object', additionalProperties: toJsonSchema(jex.items) }
  }

  if (jex.type === 'object') {
    const entries = Object.entries(jex.properties)
    const requiredEntries = entries.filter(([_, jex]) => !isOptional(jex)).map(([k]) => k)
    return {
      type: 'object',
      properties: Object.fromEntries(entries.map(([k, v]) => [k, toJsonSchema(v)])),
      required: requiredEntries
    }
  }

  if (jex.type === 'tuple') {
    return { type: 'array', items: jex.items.map(toJsonSchema) }
  }

  return {}
}
