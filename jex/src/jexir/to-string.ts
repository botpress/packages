import * as jexir from '../jexir'

const _primitiveToString = (jexPrimitive: jexir.JexPrimitive): string => {
  if ('value' in jexPrimitive) {
    return JSON.stringify(jexPrimitive.value)
  }
  return jexPrimitive.type
}

/**
 *
 * @param jexSchema the schema to convert
 * @returns A string representation of the schema for easier debugging. This string is used when returning an extension failure reason.
 */
export const toString = (jexSchema: jexir.JexType): string => {
  if (jexSchema.type === 'undefined') return 'undefined'
  if (jexSchema.type === 'null') return 'null'
  if (jexSchema.type === 'string' || jexSchema.type === 'number' || jexSchema.type === 'boolean')
    return _primitiveToString(jexSchema)

  if (jexSchema.type === 'array') {
    const itemIsUnion = jexSchema.items.type === 'union'
    if (itemIsUnion) {
      return `(${toString(jexSchema.items)})[]`
    }
    return `${toString(jexSchema.items)}[]`
  }

  if (jexSchema.type === 'tuple') {
    return `[${jexSchema.items.map(toString).join(', ')}]`
  }

  if (jexSchema.type === 'map') {
    return `{ [key: string]: ${toString(jexSchema.items)} }`
  }

  if (jexSchema.type === 'union') {
    return jexSchema.anyOf.map(toString).join(' | ')
  }

  if (jexSchema.type === 'object') {
    return `{ ${Object.entries(jexSchema.properties)
      .map(([key, value]) => `${key}: ${toString(value)}`)
      .join(', ')} }`
  }

  return 'any'
}
