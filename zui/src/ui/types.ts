import type { ZodSchema, ZodType, z } from 'zod'
import type { Rule } from '@jsonforms/core'
import { zuiKey } from '../zui'

export type ZuiSchemaExtension = {
  [zuiKey]: {
    displayAs?: [string, any]
  }
}

export type ArraySchema = {
  type: 'array'
  items: JSONSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minContains?: number
  maxContains?: number
} & ZuiSchemaExtension

export type ObjectSchema = {
  type: 'object'
  properties: {
    [key: string]: JSONSchema
  }
  required?: string[]
  additionalProperties: boolean
  default?: any
  maxProperties?: number
  minProperties?: number
  dependentRequired?: {
    [key: string]: string[]
  }
} & ZuiSchemaExtension

export type StringSchema = {
  type: 'string'
  enum?: string[]
  const?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  default?: string
} & ZuiSchemaExtension

export type NumberSchema = {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  multipleOf?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  enum?: number[]
} & ZuiSchemaExtension

export type BooleanSchema = {
  type: 'boolean'
  enum?: boolean[]
  const?: boolean
} & ZuiSchemaExtension

export type PrimitiveSchema = StringSchema | NumberSchema | BooleanSchema

export type JSONSchema = ArraySchema | ObjectSchema | PrimitiveSchema

export type JSONSchemaOfType<T extends BaseType> = T extends 'string'
  ? StringSchema
  : T extends 'number'
  ? NumberSchema
  : T extends 'boolean'
  ? BooleanSchema
  : T extends 'object'
  ? ObjectSchema
  : T extends 'array'
  ? ArraySchema
  : never

export type UILayoutSchema =
  | {
      type: 'VerticalLayout' | 'HorizontalLayout'
      elements: UISchema[]
      rule?: UIRuleSchema
    }
  | {
      type: 'Group'
      label: string
      elements: UISchema[]
      rule?: UIRuleSchema
    }
  | {
      type: 'Categorization'
      elements: UICategorySchema[]
      rule?: UIRuleSchema
    }

export type UICategorySchema = {
  type: 'Category'
  label: string
  elements: UISchema[]
  rule?: UIRuleSchema
}

export type UIControlSchema = {
  type: 'Control'
  scope: string
  label?: string | boolean
  options?: {
    [key: string]: any
    format?: 'time' | 'date' | 'date-time' | 'radio' | string
    detail?: 'DEFAULT' | 'GENERATED' | 'REGISTERED' | UILayoutSchema
    readOnly?: boolean
    autocomplete?: boolean
    multi?: boolean
    slider?: boolean
    showUnfocusedDescription?: boolean
    toggle?: boolean
    trim?: boolean
  }
  rule?: UIRuleSchema
}

export type UIRuleSchema = Rule

export type UISchema = UIControlSchema | UILayoutSchema | UICategorySchema

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'
export type ContainerType = 'object' | 'array'

export type UIComponentDefinitions = {
  [type in BaseType]: {
    [id: string | number | symbol]: {
      id: string
      schema: ZodSchema
    }
  }
}

export interface ComponentDefinitions {}

export type GlobalComponentDefinitions = ComponentDefinitions extends {
  components: infer TComponentMap extends UIComponentDefinitions
}
  ? TComponentMap
  : any

export type ZodToBaseType<T extends ZodType> = T extends z.ZodString
  ? 'string'
  : T extends z.ZodBoolean
  ? 'boolean'
  : T extends z.ZodNumber
  ? 'number'
  : T extends z.ZodArray<any, any>
  ? 'array'
  : T extends z.ZodObject<any, any>
  ? 'object'
  : any

export type AsBaseType<T> = T extends BaseType ? T : never

export type ComponentImplementationMap<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  [Type in keyof UI]: {
    [ID in keyof UI[Type]]: UIComponent<AsBaseType<Type>, ID, UI>
  } & {
    default?: UIComponent<AsBaseType<Type>, 'default', UI>
  }
}

type SchemaContext<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = {
  type: Type
  id: ID
  scope: string
  schema: JSONSchemaOfType<Type>
}

type UIComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
> = Type extends ContainerType
  ? (params: z.infer<UI[Type][ID]['schema']>, context: SchemaContext<Type, ID, UI>, children: UISchema[]) => UISchema
  : (params: z.infer<UI[Type][ID]['schema']>, context: SchemaContext<Type, ID, UI>) => UISchema
