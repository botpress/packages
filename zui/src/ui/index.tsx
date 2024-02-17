import {
  BaseType,
  ContainerType,
  GlobalComponentDefinitions,
  SchemaContext,
  UIComponentDefinitions,
  UILayoutSchema,
  ZuiComponentMap,
  ZuiReactComponentBaseProps,
  containerTypes,
} from './types'
import { zuiKey } from '../zui'
import { JsonForms, type JsonFormsInitStateProps, type JsonFormsReactProps } from '@jsonforms/react'
import { useMemo } from 'react'
import { UISchema } from './types'
import { JSONSchema } from './types'
import { SchemaResolversMap } from './types'
import { defaultExtensions } from './defaultextension'
import { ControlProps, JsonFormsProps } from '@jsonforms/core'
import { JsonFormsDispatch, useJsonForms, withJsonFormsControlProps, withJsonFormsLayoutProps } from '@jsonforms/react'
import { FC } from 'react'

export type ZuiFormProps<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = Omit<
  JsonFormsInitStateProps,
  'uischema' | 'schema'
> &
  JsonFormsReactProps & {
    overrides: SchemaResolversMap<UI>
    schema: JSONSchema
  }

export const defaultControlResolver = (
  params: any,
  ctx: SchemaContext<'string' | 'number' | 'boolean', string>,
): UISchema => {
  return {
    type: 'Control',
    scope: ctx.scope,
    _componentID: ctx.id,
    label: ctx.zuiProps?.title ?? true,
    options: {
      ...params,
    },
  }
}

export const defaultContainerResolver = (
  _: any,
  ctx: SchemaContext<ContainerType, string>,
  children: UISchema[],
): UISchema => {
  return {
    type: 'HorizontalLayout',
    _componentID: ctx.id,
    elements: children,
    label: ctx.zuiProps.title ?? true,
  } as UILayoutSchema
}

export const defaultUISchemaResolvers: SchemaResolversMap<typeof defaultExtensions> = {
  string: {
    default: defaultControlResolver,
  },
  number: {
    default: defaultControlResolver,
  },
  boolean: {
    default: defaultControlResolver,
  },
  object: {
    default: defaultContainerResolver,
  },
  array: {
    default: defaultContainerResolver,
  },
}

const getSchemaResolver = <Type extends BaseType, UI extends UIComponentDefinitions = GlobalComponentDefinitions>(
  type: Type,
  id: keyof UI[BaseType] & string,
  overrides: SchemaResolversMap<UI> = {},
) => {
  const typeResolvers = { ...defaultUISchemaResolvers[type], ...overrides[type] }
  const componentFunc = typeResolvers?.[id] || typeResolvers?.default
  if (!componentFunc) {
    return null
  }
  return componentFunc
}

const keyToScope = (key: string) => {
  return '#/properties/' + key
}

export const schemaToUISchema = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>(
  schema: JSONSchema,
  overrides: SchemaResolversMap<UI> = {},
  currentKey: string = 'root',
): UISchema | null => {
  const scope = keyToScope(currentKey)

  const zuiProps = schema[zuiKey]

  if (zuiProps?.hidden) {
    return null
  }

  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties)
      .map(([key, value]) => {
        return schemaToUISchema(value, overrides, key)
      })
      .filter(Boolean) as UISchema[]

    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      const resolver = getSchemaResolver(schema.type, 'default', overrides)
      return resolver?.({}, { type: 'object', id: 'default', schema, scope, zuiProps }, properties) || null
    }

    const [id, params] = schema[zuiKey].displayAs
    const resolver = getSchemaResolver(schema.type, id, overrides)

    return resolver?.(params, { type: schema.type, id: id as any, schema, scope, zuiProps }, properties) || null
  }

  if (schema.type === 'array') {
    const items = schemaToUISchema(schema.items, overrides, currentKey)
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      const resolver = getSchemaResolver(schema.type, 'default', overrides)
      return (
        resolver?.(
          {},
          { type: 'array', id: 'default', schema, scope, zuiProps },
          [items].filter(Boolean) as UISchema[],
        ) || null
      )
    }
    const [id, params] = schema[zuiKey].displayAs
    const resolver = getSchemaResolver(schema.type, id, overrides)
    return (
      resolver?.(
        params,
        { type: schema.type, id: id as any, schema, scope, zuiProps },
        [items].filter(Boolean) as UISchema[],
      ) || null
    )
  }

  if (schema.type === 'string' || schema.type === 'boolean' || schema.type === 'number') {
    if (!schema[zuiKey]?.displayAs || schema[zuiKey].displayAs.length !== 2) {
      const resolver = getSchemaResolver(schema.type, 'default', overrides) as any
      return resolver?.({}, { type: schema.type, id: 'default', scope, zuiProps }) || null
    }
    const [id, params] = schema[zuiKey].displayAs
    const resolver = getSchemaResolver(schema.type, id, overrides) as any
    return resolver?.(params, { type: schema.type, id, schema, scope, zuiProps }) || null
  }

  console.error('No component function found for', schema.type, schema)

  return null
}

export function ZuiForm<UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
  schema,
  overrides = {},
  ...jsonformprops
}: ZuiFormProps<UI>): React.JSX.Element | null {
  const uiSchema = useMemo(() => {
    return schemaToUISchema<UI>(schema, overrides)
  }, [schema, overrides])

  if (!uiSchema) {
    console.warn('UI Schema returned null, skipping form rendering')
    return null
  }

  return <JsonForms schema={schema} uischema={uiSchema} {...jsonformprops} />
}

const transformControlProps = <Type extends BaseType>(
  type: Type,
  id: string,
  props: ControlProps,
): ZuiReactComponentBaseProps<Type, string> => {
  const { uischema, id: renderID, schema, renderers, path, cells, enabled, handleChange } = props
  const transformedProps: ZuiReactComponentBaseProps<Type, string> = {
    type,
    id,
    params: uischema?.options,
    scope: path!,
    onChange: (data) => handleChange(path, data),
    context: {
      path: path!,
      renderID: renderID!,
      enabled: enabled!,
      uiSchema: uischema! as any,
      fullSchema: schema! as any,
      renderers: renderers!,
      cells: cells!,
    },
  }

  return transformedProps
}

const withTransformControlProps = (type: BaseType, id: string, Component: FC<any>) => {
  return withJsonFormsControlProps((props) => {
    const form = useJsonForms()
    const transformedProps = transformControlProps(type, id, props)
    return <Component {...transformedProps} form={form} />
  })
}

const transformLayoutProps = <Type extends ContainerType>(
  type: Type,
  id: string,
  props: any,
): ZuiReactComponentBaseProps<ContainerType, string> & { children: any[] } => {
  const { uischema, id: renderID, schema, renderers, path, cells, enabled, handleChange } = props

  return {
    type,
    id,
    params: uischema.options!,
    scope: path!,
    onChange: (data) => handleChange(path, data),
    context: {
      path: path!,
      renderID: renderID!,
      enabled: enabled!,
      uiSchema: uischema! as any,
      fullSchema: schema! as any,
      renderers: renderers!,
      cells: cells!,
    },
    children: uischema.elements.map((child: any, index: number) => {
      return (
        <div key={`${path}-${index}`}>
          <JsonFormsDispatch
            renderers={renderers}
            cells={cells}
            uischema={child}
            schema={schema}
            path={path}
            enabled={enabled}
          />
        </div>
      )
    }),
  }
}

const withTransformLayoutProps = (type: ContainerType, id: string, Component: FC<any>) => {
  return withJsonFormsLayoutProps((props: any) => {
    const transformedProps = transformLayoutProps(type, id, props)
    return <Component {...transformedProps} />
  })
}

export const transformZuiComponentsToRenderers = (
  components: ZuiComponentMap,
): NonNullable<JsonFormsProps['renderers']> => {
  return Object.entries(components)
    .map(([type, ids]) => {
      return Object.entries(ids).map(([id, component]) => {
        if (containerTypes.includes(type as ContainerType)) {
          return {
            tester: (uischema: any, _: any, __: any) => {
              return uischema?._componentID === id ? 100 : 0
            },
            renderer: withTransformLayoutProps(type as ContainerType, id, component),
          }
        }
        return {
          tester: (uischema: any, _: any, __: any) => {
            return uischema?.type === 'Control' && uischema?._componentID === id ? 100 : 0
          },
          renderer: withTransformControlProps(type as BaseType, id, component),
        }
      })
    })
    .reduce((acc, val) => acc.concat(val), [])
}
