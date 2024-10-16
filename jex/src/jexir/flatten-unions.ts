import * as types from './typings'

export const flattenUnions = (schema: types.JexType): types.JexType => {
  if (schema.type === 'array') {
    return {
      type: 'array',
      items: flattenUnions(schema.items)
    }
  }

  if (schema.type === 'object') {
    const properties: Record<string, types.JexType> = {}
    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = flattenUnions(value)
    }
    return {
      type: 'object',
      properties
    }
  }

  if (schema.type === 'union') {
    const anyOf: types.JexType[] = []
    for (const item of schema.anyOf) {
      const flattened = flattenUnions(item)
      if (flattened.type === 'union') {
        anyOf.push(...flattened.anyOf)
      } else {
        anyOf.push(flattened)
      }
    }
    return {
      type: 'union',
      anyOf
    }
  }

  return schema
}
