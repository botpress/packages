import * as ajv from 'ajv'
import { JSONSchema } from '../json-schema'

export type ValidationResult =
  | {
      success: true
      data: any
    }
  | {
      success: false
      error: string
    }

export const validate = (schema: JSONSchema, data: any): ValidationResult => {
  const ajvInstance = new ajv.default({ allErrors: true, strictSchema: false })
  const validate = ajvInstance.compile(schema)
  const valid = validate(data)

  if (!valid) {
    return {
      success: false,
      error: ajvInstance.errorsText(validate.errors),
    }
  }

  return {
    success: true,
    data,
  }
}
