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
    <FormDataProvider formData={value} setFormData={onChange} formSchema={schema}>
      <FormElementRenderer components={components} fieldSchema={schema} path={[]} config={{ required: false, formData: value, onFormChange: onChange }} />
    </FormDataProvider >)
}

type FormRendererProps = {
  components: ZuiComponentMap<any>,
  fieldSchema: JSONSchema,
  path: string[],
  required: boolean,
}

const FormElementRenderer: FC<FormRendererProps> = ({ components, fieldSchema, path, required }) => {
  const { formData, handlePropertyChange, addArrayItem, removeArrayItem, formErrors, formValid } = useFormData()
  const data = useMemo(() => getPathData(formData, path), [formData, path])
  const componentMeta = useMemo(() => resolveComponent(components, fieldSchema), [fieldSchema, components])

  if (!componentMeta) {
    return null
  }

  const { Component: _component, type } = componentMeta

  const pathString = path.length > 0 ? path.join('.') : 'root'

  const baseProps: Omit<ZuiReactComponentBaseProps<BaseType, any>, 'data'> = {
    type,
    componentID: componentMeta.id,
    scope: pathString,
    context: {
      path: pathString,
      readonly: false,
      formData,
      formErrors: formErrors || null,
      formValid: formValid || null,
      updateForm: handlePropertyChange,
    },
    enabled: fieldSchema['x-zui']?.disabled !== true,
    onChange: (data: any) => handlePropertyChange(pathString, data),
    errors: formErrors?.filter(e => e.path.join('.') === pathString) || [],
    label: fieldSchema['x-zui']?.title || path[path.length - 1]?.toString() || '',
    params: componentMeta.params,
    schema: fieldSchema,
    zuiProps: fieldSchema[zuiKey] || {},
  }

  if (fieldSchema.type === 'array' && type === 'array') {
    const Component = _component as any as ZuiReactComponent<'array', any>
    const props: Omit<ZuiReactComponentProps<'array', any>, 'children'> = {
      ...baseProps,
      type,
      schema: baseProps.schema as any as ArraySchema,
      data: Array.isArray(data) ? data : [],
      addItem: (data) => addArrayItem(baseProps.context.path, data),
      removeItem: (index) => removeArrayItem(baseProps.context.path, index),
    }

    return <Component
      key={baseProps.scope}
      {...props}>
      {props.data?.map((_, index) => {
        const childPath = [...path, index.toString()]
        return <FormElementRenderer key={childPath.join('.')} components={components} fieldSchema={fieldSchema.items} path={childPath} required={required} />
      }
      ) || []}
    </Component>
  }

  if (fieldSchema.type === 'object' && type === 'object') {
    const Component = _component as any as ZuiReactComponent<'object', any>
    const props: Omit<ZuiReactComponentProps<'object', any>, 'children'> = {
      ...baseProps,
      type,
      schema: baseProps.schema as any as ObjectSchema,
      data: data || {},
    }
    return (
      <Component
        key={baseProps.scope}
        {...props}
      >
        {Object.entries(fieldSchema.properties).map(([fieldName, childSchema]) => {
          const childPath = [...path, fieldName]
          return <FormElementRenderer key={childPath.join('.')} components={components} fieldSchema={childSchema} path={childPath} required={fieldSchema.required?.includes(fieldName) || false} />
        })}
      </Component>
    )
  }
  const Component = _component as any as ZuiReactComponent<any, any>

  const props: ZuiReactControlComponentProps<'boolean' | 'number' | 'string', any> = {
    ...baseProps,
    type: type as any as 'boolean' | 'number' | 'string',
    schema: baseProps.schema as any as PrimitiveSchema,
    config: {},
    required,
    data,
  }

  return (
    <Component
      {...props}
    />
  )
}
