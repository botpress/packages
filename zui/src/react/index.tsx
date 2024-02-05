import React from 'react'
import type { ZUIComponent, ZUIComponentLibrary, ZUIFieldComponent } from './types'
import { BaseType, ContainerType, GlobalExtensionDefinition, UIExtension, containerTypes } from '../uiextensions'
import { zuiKey } from '../zui'

export const NotImplementedComponent: ZUIFieldComponent<any, any> = ({ type, id }) => {
  return (
    <div>
      <p>
        {type} {id} not implemented
      </p>
    </div>
  )
}

export const NotFoundComponent: ZUIFieldComponent<any, any> = ({ type, id }) => {
  return (
    <div>
      <p>
        {type || null} {id || null} component not found
      </p>
    </div>
  )
}

export interface ZuiFormProps<UI extends UIExtension = GlobalExtensionDefinition> {
  components: ZUIComponentLibrary<UI>
  schema: any
}

const resolveComponent = (components: ZUIComponentLibrary<any>, fieldSchema: any, path: string[]) => {
  const type = fieldSchema.type as BaseType
  const uiDefinition = fieldSchema[zuiKey]?.displayAs || null

  if (!uiDefinition || !Array.isArray(uiDefinition) || uiDefinition.length < 2) {
    const defaultComponent = components[type]?.default
    if (defaultComponent) {
      return { Component: defaultComponent, type, id: 'default', params: {}, path, isContainer: containerTypes.includes(type as ContainerType)}
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

  return { Component: Component as ZUIComponent<any, any>, type, id: componentID, params, path, isContainer: containerTypes.includes(type as ContainerType)}
}


export const ZuiForm = <T extends UIExtension = GlobalExtensionDefinition>({ schema, components }: ZuiFormProps<T>): JSX.Element | null => {
  const renderField = (fieldSchema: any, path: string[]) => {
    const componentConfig = resolveComponent(components, fieldSchema, path);

    if (!componentConfig) {
      return null;
    }

    const { Component, id, isContainer, path: currentPath, params, type } = componentConfig;
    
    if (!Component) {
      console.error(`Component not found for type: ${type} at path: ${path.join('.')}`);
      return null;
    }

    return (
      <Component
        key={path.length > 0 ? path.join('.') : 'root'}
        id={id}
        type={type}
        params={params}
        children={isContainer ? renderObjectFields(fieldSchema, currentPath) : undefined}
      />
    );
  };

  const renderObjectFields = (objectSchema: any, path: string[]): (JSX.Element | null)[] => {
    const { properties } = objectSchema;
    const fields: (JSX.Element | null)[] = [];
    
    for (const [fieldName, fieldSchema] of Object.entries(properties) as [string, any]) {
      const fieldPath = [...path, fieldName];

      if (!fieldSchema) {
        console.error(`Field schema not found for field: ${fieldPath.join('.')}`);
        continue;
      }

      const renderedField = renderField(fieldSchema, fieldPath);

      fields.push(renderedField);
    }
    
    return fields;
  };

  return (
    <form>
      {renderField(schema, [])}
    </form>
  );
};

export { defaultComponentLibrary, defaultExtensions } from './defaults'
