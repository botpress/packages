import { parseSchema } from '@bpinternal/json-schema-to-zod'
import { ZodTypeAny } from 'zod'
import { ZuiTypeAny, zui, zuiKey } from './zui'
import { JsonSchema7 } from '.'

const jsonSchemaToZodStr = (schema: any): string => {
  return parseSchema(schema, {
    seen: new Map(),
    path: [],
  })
}

const jsonSchemaToZod = (schema: any): ZodTypeAny => {
  let code = jsonSchemaToZodStr(schema)
  code = code.replaceAll('errors: z.ZodError[]', 'errors')
  return new Function('z', `return ${code}`)(zui) as ZodTypeAny
}

const applyZuiPropsRecursively = (zodField: ZodTypeAny, jsonSchemaField: any) => {
  if (jsonSchemaField[zuiKey]) {
    zodField._def[zuiKey] = jsonSchemaField[zuiKey]
  }

  if (jsonSchemaField.type === 'object' && jsonSchemaField.properties) {
    Object.keys(jsonSchemaField.properties).forEach((key) => {
      const nestedField = jsonSchemaField.properties[key]
      const shape = zodField._def.shape()

      if (shape[key]) {
        applyZuiPropsRecursively(shape[key], nestedField)
      }
    })
  }

  if (jsonSchemaField.type === 'array' && jsonSchemaField.items) {
    const items = jsonSchemaField.items

    if (typeof items === 'object' && !Array.isArray(items)) {
      const arrayShape = zodField._def.type

      if (arrayShape) {
        applyZuiPropsRecursively(arrayShape, items)
      }
    } else if (Array.isArray(items)) {
      items.forEach((item, index) => {
        if (zodField._def.type[index]) {
          applyZuiPropsRecursively(zodField._def.type[index], item)
        }
      })
    }
  }
}

export const jsonSchemaToZui = (schema: JsonSchema7): ZuiTypeAny => {
  const zodSchema = jsonSchemaToZod(schema)
  applyZuiPropsRecursively(zodSchema, schema)
  return zodSchema as unknown as ZuiTypeAny
}
