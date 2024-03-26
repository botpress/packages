import {
  BaseType,
  UIComponentDefinitions,
  ZuiComponentMap,
  JSONSchema,
  ZuiReactComponent,
  ZuiReactComponentBaseProps,
  ObjectSchema,
  ArraySchema,
  ZuiReactComponentProps,
  ZuiReactControlComponentProps,
  PrimitiveSchema,
} from './types'
import { zuiKey } from '../zui'
import { useMemo } from 'react'
import React, { FC } from 'react'
import { GlobalComponentDefinitions } from '..'
import { FormDataProvider, useFormData } from './providers/FormDataProvider'
import { getPathData } from './providers/FormDataProvider'

type ComponentMeta<Type extends BaseType = BaseType> = {
  type: Type,
  Component: ZuiReactComponent<Type, string>,
  id: string,
  params: any,
}

const resolveComponent = <Type extends BaseType>(components: ZuiComponentMap<any>, fieldSchema: JSONSchema): ComponentMeta<Type> | null => {
  const type = fieldSchema.type as BaseType
  const uiDefinition = fieldSchema[zuiKey]?.displayAs || null

  if (!uiDefinition || !Array.isArray(uiDefinition) || uiDefinition.length < 2) {
    const defaultComponent = components[type]?.default
    if (defaultComponent) {
      return {
        Component: defaultComponent as ZuiReactComponent<Type, string>,
        type: type as Type,
        id: 'default',
        params: {},
      }
    }
    return null
  }

  const componentID: string = uiDefinition[0] || 'default'

  const Component = components[type]?.[componentID] || null

  if (!Component) {
    console.warn(`Component ${type}.${componentID} not found`)
    return null
  }

  const params = uiDefinition[1] || {}

  return {
    Component: Component as ZuiReactComponent<Type, string>,
    type: type as Type,
    id: componentID,
    params,
  }
}


export const ZuiForm = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
  schema,
  components,
  onChange,
  value,
}: {
  schema: JSONSchema,
  components: ZuiComponentMap<UI>,
  value: any,
  onChange: (value: any) => void,
}): JSX.Element | null => {

  return (
    <FormDataProvider formData={value} setFormData={onChange}>
      <FormElementRenderer components={components} fieldSchema={schema} path={[]} config={{ required: false, formData: value, onFormChange: onChange }} />
    </FormDataProvider >)
}


const resolveBaseProps = (meta: ComponentMeta, fieldSchema: JSONSchema, config: { path: string[], required: boolean, formData: any, onChange: (path: string, data: any) => void, onFormChange: (formData: any) => void }): Omit<ZuiReactComponentBaseProps<any, any>,
  'data'> => {
  const { type, params, id } = meta

  const pathString = config.path.length > 0 ? config.path.join('.') : ''
  return {
    context: {
      path: pathString,
      readonly: false,
      formData: config.formData,
      formErrors: [],
      updateForm: config.onChange,
    },
    onChange: (data: any) => config.onChange(pathString, data),
    id: config.path[config.path.length - 1]?.toString() || 'root',
    label: fieldSchema['x-zui']?.title || config.path[config.path.length - 1]?.toString() || '',
    componentID: id,
    enabled: fieldSchema['x-zui']?.disabled !== true,
    schema: fieldSchema,
    params,
    scope: pathString,
    type,
    zuiProps: fieldSchema[zuiKey] || {},
    i18nKeyPrefix: '',
  }

}

const FormElementRenderer: FC<{ components: ZuiComponentMap<any>, fieldSchema: JSONSchema, path: string[], config: any }> = ({ components, fieldSchema, path, config }) => {
  const { formData, handlePropertyChange, addArrayItem } = useFormData()
  const data = useMemo(() => getPathData(formData, path), [formData, path])
  const componentMeta = useMemo(() => resolveComponent(components, fieldSchema), [fieldSchema, components])

  if (!componentMeta) {
    return null
  }

  const { Component: _component, type } = componentMeta

  const baseProps = resolveBaseProps(componentMeta, fieldSchema, { path, required: config.required, formData: config.formData, onChange: handlePropertyChange, onFormChange: config.onFormChange })

  if (fieldSchema.type === 'array' && type === 'array') {
    const Component = _component as any as ZuiReactComponent<'array', any>
    const props: Omit<ZuiReactComponentProps<'array', any>, 'children'> = {
      ...baseProps,
      context: {
        ...baseProps.context,
      },
      schema: baseProps.schema as any as ArraySchema,
      data: Array.isArray(data) ? data : [],
      addItem: (data) => {
        console.log(baseProps.context.path)
        addArrayItem(baseProps.context.path, data)
      },
    }

    return <Component
      key={baseProps.scope}
      {...props}>
      {props.data?.map((_, index) =>
        <FormElementRenderer components={components} fieldSchema={fieldSchema.items} path={[...path, index.toString()]} config={config} />
      ) || []}
    </Component>
  }

  if (fieldSchema.type === 'object') {
    const Component = _component as any as ZuiReactComponent<'object', any>
    const props: Omit<ZuiReactComponentProps<'object', any>, 'children'> = {
      ...baseProps,
      context: {
        ...baseProps.context,
      },
      schema: baseProps.schema as any as ObjectSchema,
      data: data || {},
    }
    return (
      <Component
        key={baseProps.scope}
        {...props}
      >
        {Object.entries(fieldSchema.properties).map(([fieldName, fieldSchema]) => {
          return <FormElementRenderer components={components} fieldSchema={fieldSchema} path={[...path, fieldName]} config={config} />
        })}
      </Component>
    )
  }
  const Component = _component as any as ZuiReactComponent<any, any>

  const props: ZuiReactControlComponentProps<'boolean' | 'number' | 'string', any> = {
    ...baseProps,
    schema: baseProps.schema as any as PrimitiveSchema,
    required: config.required,
    config: {},
    errors: '',
    data,
  }

  return (
    <Component
      {...props}
    />
  )
}
