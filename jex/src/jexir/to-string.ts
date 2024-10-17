import * as utils from '../utils'
import * as types from './typings'

const _primitiveToString = (jexPrimitive: types.JexIRPrimitive): string => {
  if ('value' in jexPrimitive) {
    return JSON.stringify(jexPrimitive.value)
  }
  return jexPrimitive.type
}

/**
 *
 * @param jexirSchema the schema to convert
 * @returns A string representation of the schema for easier debugging. This string is used when returning an extension failure reason.
 */
export const toString = (jexirSchema: types.JexIR): string => {
  if (jexirSchema.type === 'undefined') return 'undefined'
  if (jexirSchema.type === 'null') return 'null'
  if (jexirSchema.type === 'string' || jexirSchema.type === 'number' || jexirSchema.type === 'boolean')
    return _primitiveToString(jexirSchema)

  if (jexirSchema.type === 'array') {
    const itemIsUnion = jexirSchema.items.type === 'union'
    if (itemIsUnion) {
      return `(${toString(jexirSchema.items)})[]`
    }
    return `${toString(jexirSchema.items)}[]`
  }

  if (jexirSchema.type === 'tuple') {
    return `[${jexirSchema.items.map(toString).join(', ')}]`
  }

  if (jexirSchema.type === 'map') {
    return `{ [key: string]: ${toString(jexirSchema.items)} }`
  }

  if (jexirSchema.type === 'union') {
    return jexirSchema.anyOf.map(toString).join(' | ')
  }

  if (jexirSchema.type === 'intersection') {
    return jexirSchema.allOf.map(toString).join(' & ')
  }

  if (jexirSchema.type === 'object') {
    return `{ ${Object.entries(jexirSchema.properties)
      .map(([key, value]) => `${key}: ${toString(value)}`)
      .join(', ')} }`
  }

  // so that we don't forget anything
  type _expectPrimitive = utils.types.Expect<utils.types.Equals<typeof jexirSchema, types.JexIRUnknown>>
  return 'unknown'
}
