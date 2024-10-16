import * as types from './typings'

/**
 *
 * Consider two sets S1 and S2:
 * type S1 = A | (B | (C | D))
 * type S2 = A | B | C | D
 * Both sets are equivalent, but S1 is not in a flattened form.
 * This function takes a schema and returns a new schema with all unions flattened to the top level.
 *
 * @param schema a JexIR schema
 * @returns a new JexIR schema with all unions flattened
 */
export const flattenUnions = (schema: types.JexIR): types.JexIR => {
  if (schema.type === 'array') {
    return {
      type: 'array',
      items: flattenUnions(schema.items)
    }
  }

  if (schema.type === 'object') {
    const properties: Record<string, types.JexIR> = {}
    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = flattenUnions(value)
    }
    return {
      type: 'object',
      properties
    }
  }

  if (schema.type === 'union') {
    const anyOf: types.JexIR[] = []
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
