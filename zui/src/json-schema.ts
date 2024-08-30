import { JSONSchema7 } from 'json-schema'
import { zuiKey } from './ui/constants'
import { util } from './z'

/**
 * This file contains a subset of json-schema;
 * i.e. if a data conforms to this type, it is a valid json-schema **but**,
 *   there are valid json-schemas that do not conform to this type.
 */

export type SerializedFunction = string
export type ZuiExtensionObject = {
  tooltip?: boolean
  displayAs?: [string, any]
  title?: string
  disabled?: boolean | SerializedFunction
  hidden?: boolean | SerializedFunction
  placeholder?: string
  secret?: boolean
  coerce?: boolean
}

export type BaseSchema = {
  description?: string
  anyOf?: JSONSchema[]
  oneOf?: JSONSchema[]
  allOf?: JSONSchema[]
  not?: JSONSchema
  nullable?: boolean
  [zuiKey]?: ZuiExtensionObject
}

export type JSONSchemaPrimitiveType = 'string' | 'number' | 'integer' | 'boolean' | 'null'

type BaseArraySchema = BaseSchema & {
  type: 'array'
  default?: any[]
}

export type ArraySchema = BaseArraySchema & {
  items: JSONSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minContains?: number
  maxContains?: number
}

// export type TupleSchema = BaseArraySchema & {
//   items: JSONSchema[]
// }

type BaseObjectSchema = BaseSchema & {
  type: 'object'
  required?: string[]
  default?: any
  maxProperties?: number
  minProperties?: number
  dependentRequired?: {
    [key: string]: string[]
  }
}

export type ObjectSchema = BaseObjectSchema & {
  properties: Record<string, JSONSchema>
  additionalProperties?: false
}

// export type RecordSchema = BaseObjectSchema & {
//   properties?: undefined
//   additionalProperties: JSONSchema
// }

// https://json-schema.org/understanding-json-schema/reference/string#built-in-formats
export type Formats =
  | 'date-time'
  | 'time'
  | 'date'
  | 'duration'
  | 'email'
  | 'idn-email'
  | 'hostname'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uuid'
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  | 'uri-template'
  | 'json-pointer'
  | 'relative-json-pointer'
  | 'regex'

export type StringSchema = {
  type: 'string'
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: Formats
  default?: string
} & BaseSchema

export type NumberSchema = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  multipleOf?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  enum?: number[]
  default?: number
} & BaseSchema

export type BooleanSchema = {
  type: 'boolean'
  enum?: boolean[]
  default?: boolean
} & BaseSchema

// export type NullSchema = {
//   type: 'null'
//   default?: null
// } & BaseSchema

export type AnySchema = {
  type?: undefined
  default?: any
} & BaseSchema

export type PrimitiveSchema = StringSchema | NumberSchema | BooleanSchema // | NullSchema | AnySchema

export type JSONSchema = ArraySchema | ObjectSchema | PrimitiveSchema // | RecordSchema | TupleSchema

util.assertExtends<JSONSchema, JSONSchema7>(true) // ensure that JSONSchema is a subset of JSONSchema7
