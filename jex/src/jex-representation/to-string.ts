import * as types from './typings'

const _primitiveToString = (jexPrimitive: types.JexPrimitive): string => {
  if ('value' in jexPrimitive) {
    return JSON.stringify(jexPrimitive.value)
  }
  return jexPrimitive.type
}

export const toString = (jexSchema: types.JexType): string => {
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
