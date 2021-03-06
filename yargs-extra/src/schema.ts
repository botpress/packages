import { JSONSchema7, JSONSchema7Definition, JSONSchema7Type } from 'json-schema'
import { Dictionary } from 'lodash'
import { YargsSchema } from './type-utils'

export const generateSchema = (yargSchema: YargsSchema): JSONSchema7 => {
  const properties: Dictionary<JSONSchema7Definition> = {}
  for (const param in yargSchema) {
    const yargProp = yargSchema[param]

    const { type, description, choices, array } = yargProp
    let props: JSONSchema7Definition = {
      type,
      description
    }

    if (array) {
      props = { ...props, type: 'array', items: { type } }
    }

    if (choices) {
      props = { ...props, enum: choices as JSONSchema7Type[] }
    }

    properties[param] = props
  }

  const schema: JSONSchema7 = {
    type: 'object',
    properties
  }
  return schema
}
