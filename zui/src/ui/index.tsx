import {
  BaseType,
  UIComponentDefinitions,
  ZuiComponentMap,
  JSONSchema,
  ZuiReactComponent,
  ZuiReactComponentBaseProps,
  ObjectSchema,
  ArraySchema,
} from './types'
import { zuiKey } from '../zui'
import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react'
import React, { FC } from 'react'
import { GlobalComponentDefinitions } from '..'
import { FormDataProvider, useFormData } from './providers/FormDataProvider'
import { FormFieldProvider, useFormField } from './providers/FormFieldProvider'


const resolveComponent = (components: ZuiComponentMap<any>, fieldSchema: JSONSchema) => {
  const type = fieldSchema.type as BaseType
  const uiDefinition = fieldSchema[zuiKey]?.displayAs || null

  if (!uiDefinition || !Array.isArray(uiDefinition) || uiDefinition.length < 2) {
    const defaultComponent = components[type]?.default
    if (defaultComponent) {
      return {
        Component: defaultComponent,
        type,
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
    Component: Component as ZuiReactComponent<any, any>,
    type,
    id: componentID,
    params,
  }
}


export const ZuiForm2 = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
  schema,
  components,
}: {
  schema: JSONSchema,
  components: ZuiComponentMap<UI>,
  value: any,
  onChange: (value: any) => void,
}): JSX.Element | null => {

  return (
    <FormDataProvider = { initialValue }>
    
  </FormDataProvider >)
}

const renderFormFields = (components: ZuiComponentMap<any>, schema: JSONSchema, formData: any) => {
  if (schema.type === 'object') {
    return renderObjectFields(components, schema, [], formData)
  }
  if (schema.type === 'array') {
    return renderArrayFields(components, schema, [], formData)
  }
  return FieldRenderer(components, schema, [], formData)
}

const resolveProps = (fieldSchema: JSONSchema, componentConfig: NonNullable<ReturnType<typeof resolveComponent>>, config: { path: string[], required: boolean, formData: any }) => {
  const { id, params, type } = componentConfig

  const pathString = config.path.length > 0 ? config.path.join('.') : 'root'
  return {
    context: {
      path: pathString,
      readonly: false,
      formData: config.formData,
      formErrors: [],
      dispatch: () => { },
    },
    onChange: () => { },
    id: pathString,
    label: fieldSchema['x-zui']?.title || config.path[config.path.length - 1]?.toString() || '',
    componentID: id,
    enabled: fieldSchema['x-zui'].disabled !== true,
    schema: fieldSchema,
    params,
    scope: pathString,
    type,
    zuiProps: fieldSchema[zuiKey] || {},
    i18nKeyPrefix: '',
  }

}

const FieldDispatch: FC<{ components: ZuiComponentMap<any>, fieldSchema: JSONSchema, path: string[], config: any }> = ({
  components,
  fieldSchema,
  path,
  config,
}) => {
  const { formData, handlePropertyChange } = useFormData()

  const componentConfig = useMemo(() => resolveComponent(components, fieldSchema), [fieldSchema, components])
  const pathString = useMemo(() => path.length > 0 ? path.join('.') : '', [path])

  if (!componentConfig) {
    return null
  }

  return (
    <FormFieldProvider path={pathString} key={pathString}>
      <FormElementRenderer
        componentConfig={componentConfig}
        fieldSchema={fieldSchema}
        path={path}
        config={config} />
    </FormFieldProvider>
  )
}

const FormElementRenderer = ({ componentConfig, fieldSchema, path, config }) => {
  const { data, path, } = useFormField()
  if (componentConfig.type === 'array') {
    return <FormArrayRenderer Component={componentConfig.Component} fieldSchema={fieldSchema} path={path} config={config} />

  }
}

const FormArrayRenderer = ({ Component, fieldSchema, path, config }) => {
  const { data, onChange, path } = useFormField()
  return (
    <Component
      key={path}
      data={{}}
      children={renderArrayFields(components, fieldSchema, path, [1, 2, 3, 4, 5])}
    />
  )
}

const FieldRenderer = (components: ZuiComponentMap<any>, fieldSchema: JSONSchema, path: string[], config: { required: boolean, formData: any }): ZuiReactComponentBaseProps<any, any> | null => {
  const componentConfig = useMemo(() => resolveComponent(components, fieldSchema), [fieldSchema, components])

  if (!componentConfig) {
    return null
  }

  const { Component: _component, type } = componentConfig
  const Component = _component as any as ZuiReactComponent<any, any>

  const pathString = path.length > 0 ? path.join('.') : ''
  const props = resolveProps(fieldSchema, componentConfig, { path, required: config.required, formData: config.formData })

  if (!Component) {
    console.error(`Component not found for type: ${type} at path: ${path.join('.')}`)
    return null
  }
  if (fieldSchema.type === 'array') {
    return <Component
      key={pathString}
      data={{}}
      {...props}
      children={renderArrayFields(components, fieldSchema, path, [1, 2, 3, 4, 5])}
    />
  }

  if (fieldSchema.type === 'object') {
    return (
      <Component
        key={pathString}
        data={{}}
        {...props}
        children={renderObjectFields(components, fieldSchema)}
      />
    )
  }
  return (
    <Component
      key={pathString}
      errors=""
      data={{}}
      description={fieldSchema.description}
      required={required}
      config={{}}
      {...props}
    />
  )
}
const renderArrayFields = (components: ZuiComponentMap<any>, arraySchema: ArraySchema, path: string[], data: any[]) => {

  return (
    <div>
      {data.map((_, index) => {
        const itemPath = [...path, index.toString()]
        return (
          <div key={index}>
            {FieldRenderer(components, arraySchema.items, itemPath, formData, false)}
          </div>
        )
      })}
    </div>
  )
}


const renderObjectFields = (components: ZuiComponentMap<any>, objectSchema: ObjectSchema, path: string[], data: any) => {
  const { properties } = objectSchema
  const fields: (JSX.Element | null)[] = []

  for (const [fieldName, fieldSchema] of Object.entries(properties) as [string, any]) {
    const fieldPath = [...path, fieldName]

    if (!fieldSchema) {
      console.error(`Field schema not found for field: ${fieldPath.join('.')}`)
      continue
    }

    const renderedField = FieldRenderer(components, fieldSchema, fieldPath, {
      required: objectSchema.required?.includes(fieldName) || false,
      formData: data,
    })

    fields.push(renderedField)
  }

  return fields.filter<JSX.Element>((x): x is JSX.Element => x !== null)
}

