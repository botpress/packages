import { z } from 'zod'
import { BaseType, ContainerType, GlobalExtensionDefinition, UIExtension, defaultExtensions } from '../uiextensions'
import { zuiKey } from '../zui'
import { JsonForms } from '@jsonforms/react'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'
import { useState } from 'react'

type AsBaseType<T> = T extends BaseType ? T : never

export type ZUIToUISchemas<UI extends UIExtension = GlobalExtensionDefinition> = {
  [Type in keyof UI]: {
    [ID in keyof UI[Type]]: ZUIToUISchemaFunction<AsBaseType<Type>, ID, UI>
  }
}

type ZUIToUISchemaFunction<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = GlobalExtensionDefinition,
> = Type extends ContainerType
  ? (type: Type, id: ID, params: z.infer<UI[Type][ID]['schema']>, children: UISchema[]) => UISchema
  : (type: Type, id: ID, params: z.infer<UI[Type][ID]['schema']>) => UISchema

export interface ZuiFormProps<UI extends UIExtension = GlobalExtensionDefinition> {
  components: ZUIToUISchemas<UI>
  schema: any
}

export type JSONSchema = ArraySchema | ObjectSchema | PrimitiveSchema

export type ZuiSchemaExtension = {
  [zuiKey]: {
    displayAs?: [string, any]
  }
}

export const defaultZuiExtension: ZUIToUISchemas<typeof defaultExtensions> = {
  string: {
    textbox: (_, __, { scope, multiline, label, fitContentWidth, readonly }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          multi: multiline,
          readOnly: readonly,
          trim: fitContentWidth,
        },
      }
    },
    datetimeinput: (_, __, { scope, type, label, readonly }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          format: type,
          readOnly: readonly,
        },
      }
    },
  },
  number: {
    numberinput: (_, __, { scope, readonly }) => {
      return {
        type: 'Control',
        scope,
        options: {
          readOnly: readonly,
        },
      }
    },
    slider: (_, __, { scope, label, readonly }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          slider: true,
          readOnly: readonly,
        },
      }
    },
  },
  array: {
    select: (_, __, ___, children) => {
      return {
        type: 'VerticalLayout',
        elements: children,
      }
    },
  },
  boolean: {
    checkbox: (_, __, { scope, label, readonly }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          readOnly: readonly,
        },
      }
    },
  },
  object: {
    verticalLayout: (_, __, ___, children) => {
      return {
        type: 'VerticalLayout',
        elements: children,
      }
    },
    horizontalLayout: (_, __, ___, children) => {
      return {
        type: 'HorizontalLayout',
        elements: children,
      }
    },
    category: (_, __, { label }, children) => {
      return {
        type: 'Category',
        label,
        elements: children,
      }
    },
    categorization: (_, __, ___, children) => {
      return {
        type: 'Categorization',
        elements: children as UICategorySchema[],
      }
    },
    group: (_, __, { label }, children) => {
      return {
        type: 'Group',
        label,
        elements: children,
      }
    },
  },
}

type ArraySchema = {
  type: 'array'
  items: JSONSchema
} & ZuiSchemaExtension

type ObjectSchema = {
  type: 'object'
  properties: {
    [key: string]: JSONSchema
  }
  required?: string[]
  additionalProperties: boolean
  default?: any
} & ZuiSchemaExtension

type PrimitiveSchema = {
  type: 'string' | 'number' | 'boolean'
} & ZuiSchemaExtension

type UISchema = UIControlSchema | UILayoutSchema | UICategorySchema

type UILayoutSchema =
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

type UICategorySchema = {
  type: 'Category'
  label: string
  elements: UISchema[]
  rule?: UIRuleSchema
}

type UIControlSchema = {
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

type UIRuleSchema = {
  effect: 'HIDE' | 'SHOW' | 'DISABLE' | 'ENABLE'
  condition: {
    scope: string
    schema: any
  }
}

const resolveTranslationFunction = <Type extends BaseType, UI extends UIExtension = GlobalExtensionDefinition>(
  translators: ZUIToUISchemas<UI>,
  type: Type,
  id: keyof UI[BaseType],
) => {
  const translationFunc = translators[type][id]
  if (!translationFunc) {
    throw new Error(`No translation function found for ${type}`)
  }
  return translationFunc
}

const schemaToUISchema = <UI extends UIExtension = GlobalExtensionDefinition>(
  schema: JSONSchema,
  translators: ZUIToUISchemas<UI>,
): UISchema => {
  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties).map(([key, value]) => {
      return schemaToUISchema(value, translators)
    })
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return {
        type: 'VerticalLayout',
        elements: properties,
      }
    }
    const translationFunc = resolveTranslationFunction(translators, schema.type, schema[zuiKey].displayAs[0])
    return translationFunc(schema.type, schema[zuiKey].displayAs[0], schema[zuiKey].displayAs[1], properties)
  }

  if (schema.type === 'array') {
    const items = schemaToUISchema(schema.items, translators)
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return {
        type: 'VerticalLayout',
        elements: [items],
      }
    }
    const translationFunc = resolveTranslationFunction(translators, schema.type, schema[zuiKey].displayAs[0])
    return translationFunc(schema.type, schema[zuiKey].displayAs[0], schema[zuiKey].displayAs[1], [items])
  }

  if (schema.type === 'string') {
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return {
        type: 'Control',
        scope: '#/properties/' + schema.type,
        options: {},
      }
    }
    const translationFunc = resolveTranslationFunction(translators, schema.type, schema[zuiKey].displayAs[0])
    return translationFunc(schema.type, schema[zuiKey].displayAs[0], schema[zuiKey].displayAs[1])
  }

  if (schema.type === 'number') {
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return {
        type: 'Control',
        scope: '#/properties/' + schema.type,
        options: {},
      }
    }
    const translationFunc = resolveTranslationFunction(translators, schema.type, schema[zuiKey].displayAs[0])
    return translationFunc(schema.type, schema[zuiKey].displayAs[0], schema[zuiKey].displayAs[1])
  }

  if (schema.type === 'boolean') {
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return {
        type: 'Control',
        scope: '#/properties/' + schema.type,
        options: {},
      }
    }
    const translationFunc = resolveTranslationFunction(translators, schema.type, schema[zuiKey].displayAs[0])
    return translationFunc(schema.type, schema[zuiKey].displayAs[0], schema[zuiKey].displayAs[1])
  }

  throw new Error(`Unknown schema type: ${schema.type}`)
}

export const ZuiForm = <T extends UIExtension = GlobalExtensionDefinition>({ schema, components }: ZuiFormProps<T>) => {
  const [data, setData] = useState({})
  return (
    <>
      <JsonForms
        data={data}
        onChange={({ errors, data }) => setData(data)}
        schema={schema}
        uischema={schemaToUISchema(schema, components)}
        renderers={vanillaRenderers}
        cells={vanillaCells}
      />
    </>
  )
}
