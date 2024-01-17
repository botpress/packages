import { zodToJsonSchema } from '@bpinternal/zod-to-json-schema'

import type { JsonSchema7ArrayType } from '@bpinternal/zod-to-json-schema/src/parsers/array'
import type { JsonSchema7ObjectType } from '@bpinternal/zod-to-json-schema/src/parsers/object'
import type { JsonSchema7, ZuiExtension, ZuiTypeAny, ZuiType } from './index'
import { zuiKey } from './zui'

type JsonSchemaWithZui = JsonSchema7 & {
  [zuiKey]?: ZuiExtension<ZuiTypeAny>
}

export const zuiToJsonSchema = (zuiType: ZuiTypeAny): JsonSchemaWithZui => {
  const jsonSchema = zodToJsonSchema(zuiType)
  return mergeZuiIntoJsonSchema(jsonSchema as JsonSchema7, zuiType)
}

const isObject = (schema: JsonSchema7): schema is JsonSchema7ObjectType =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'object' && (schema as any).properties

const isArray = (schema: JsonSchema7): schema is JsonSchema7ArrayType =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).type === 'array'

const mergeZuiIntoJsonSchema = (jsonSchema: JsonSchemaWithZui, zuiSchema: ZuiType<any>): JsonSchema7 => {
  if (isObject(jsonSchema)) {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      const shape = zuiSchema._def.shape?.()

      if (shape?.[key]) {
        const innerZui = shape[key].ui as ZuiExtension<ZuiTypeAny>['ui']

        if (innerZui.examples) {
          Object.assign(value, { examples: innerZui.examples })
        }

        Object.assign(value, { [zuiKey]: innerZui })
        mergeZuiIntoJsonSchema(value, shape[key])
      }
    }
  }

  if (isArray(jsonSchema)) {
    if (Array.isArray(jsonSchema.items)) {
      jsonSchema.items.forEach((item, index) => mergeZuiIntoJsonSchema(item, zuiSchema._def.typeOf[index]))
    } else if (jsonSchema.items) {
      mergeZuiIntoJsonSchema(jsonSchema.items, zuiSchema._def.typeOf)
    }
  }

  if (zuiSchema?.ui) {
    Object.assign(jsonSchema, { [zuiKey]: zuiSchema.ui })
  }

  return jsonSchema
}
