import { JsonSchemaObject, Serializable } from '../types'

export const parseEnum = (schema: JsonSchemaObject & { enum: Serializable[] }) => {
  if (schema.enum.length === 0) {
    return 'z.never()'
  } else if (schema.enum.length === 1) {
    // union does not work when there is only one element
    return `z.literal(${JSON.stringify(schema.enum[0])})`
  } else if (schema.enum.every((x) => typeof x === 'string')) {
    return `z.enum([${schema.enum.map((x) => JSON.stringify(x))}])`
  } else {
    return `z.union([${schema.enum.map((x) => `z.literal(${JSON.stringify(x)})`).join(', ')}])`
  }
}
