import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'

export const partiallyUnref = (schema: JSONSchema7, references: Record<string, JSONSchema7>): JSONSchema7 => {
  if ('$ref' in schema) {
    const ref = schema.$ref
    if (!ref) {
      return schema
    }

    const resolved = references[ref]
    if (!resolved) {
      return schema
    }

    return { ...resolved } // no need to unref deeper
  }

  const clone = _.cloneDeep(schema)

  if (schema.properties) {
    clone.properties = _(schema.properties)
      .toPairs()
      .map(([key, prop]) => {
        if (typeof prop === 'boolean') {
          return [key, prop]
        }
        return [key, partiallyUnref(prop, references)]
      })
      .fromPairs()
      .value()
  }

  if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
    clone.additionalProperties = partiallyUnref(schema.additionalProperties, references)
  }

  if (schema.items && typeof schema.items !== 'boolean') {
    clone.items = Array.isArray(schema.items)
      ? schema.items.map((item) => {
          if (typeof item === 'boolean') {
            return item
          }
          return partiallyUnref(item, references)
        })
      : partiallyUnref(schema.items, references)
  }

  if (schema.additionalItems && typeof schema.additionalItems !== 'boolean') {
    clone.additionalItems = partiallyUnref(schema.additionalItems, references)
  }

  if (schema.anyOf) {
    clone.anyOf = schema.anyOf.map((item) => {
      if (typeof item === 'boolean') {
        return item
      }
      return partiallyUnref(item, references)
    })
  }

  return clone
}
