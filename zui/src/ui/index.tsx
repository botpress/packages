import { BaseType, GlobalComponentDefinitions, UIComponentDefinitions } from './types'
import { zuiKey } from '../zui'
import { JsonForms, type JsonFormsInitStateProps, type JsonFormsReactProps } from '@jsonforms/react'
import { useMemo } from 'react'
import { UISchema } from './types'
import { JSONSchema } from './types'
import { ComponentImplementationMap } from './types'

export type ZuiFormProps<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = Omit<
  JsonFormsInitStateProps,
  'uischema' | 'schema'
> &
  JsonFormsReactProps & {
    components: ComponentImplementationMap<UI>
    schema: JSONSchema
  }

const resolveComponentFunction = <
  Type extends BaseType,
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
>(
  components: ComponentImplementationMap<UI>,
  type: Type,
  id: keyof UI[BaseType] & string,
) => {
  const componentFunc = components[type][id]
  if (!componentFunc) {
    throw new Error(`No translation function found for ${type}`)
  }
  return componentFunc
}

const keyToScope = (key: string) => {
  return '#/properties/' + key
}

export const schemaToUISchema = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>(
  schema: JSONSchema,
  components: ComponentImplementationMap<UI>,
  currentKey: string = 'root',
): UISchema | null => {
  const scope = keyToScope(currentKey)

  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties)
      .map(([key, value]) => {
        return schemaToUISchema(value, components, key)
      })
      .filter(Boolean) as UISchema[]

    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return (
        components.object.default?.('object', 'default', {}, properties, {
          schema,
          scope,
        }) || null
      )
    }

    const [id, params] = schema[zuiKey].displayAs
    const translationFunc = resolveComponentFunction(components, schema.type, id)

    return translationFunc(schema.type, id, params, properties, { schema, scope })
  }

  if (schema.type === 'array') {
    const items = schemaToUISchema(schema.items, components, currentKey)
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      return (
        components.array.default?.('array', 'default', {}, [items].filter(Boolean) as UISchema[], { schema, scope }) ||
        null
      )
    }
    const [id, params] = schema[zuiKey].displayAs
    const translationFunc = resolveComponentFunction(components, schema.type, id)
    return translationFunc(schema.type, id, params, [items].filter(Boolean) as UISchema[], { schema, scope })
  }

  if (schema.type === 'string' || schema.type === 'boolean' || schema.type === 'number') {
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      const defaultComponent = components[schema.type].default as any
      return defaultComponent?.(schema.type, 'default', {}, scope) || null
    }
    const [id, params] = schema[zuiKey].displayAs
    const translationFunc = resolveComponentFunction(components, schema.type, id) as any
    return translationFunc(schema.type, id, params, { schema, scope })
  }

  console.error('No component function found for', schema.type, schema)

  return null
}

export const ZuiForm = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
  schema,
  components,
  ...jsonformprops
}: ZuiFormProps<UI>) => {
  const uiSchema = useMemo(() => {
    return schemaToUISchema<UI>(schema, components)
  }, [schema, components])

  if (!uiSchema) {
    console.warn('UI Schema returned null, skipping form rendering')
    return null
  }

  return <JsonForms schema={schema} uischema={uiSchema} {...jsonformprops} />
}
