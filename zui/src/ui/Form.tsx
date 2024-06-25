import React from 'react'
import { useEffect } from 'react'
import { BoundaryFallbackComponent, ErrorBoundary } from './ErrorBoundary'
import { FormDataProvider, deepMerge, getDefaultValues } from './hooks/useFormData'
import { DefaultComponentDefinitions, JSONSchema, UIComponentDefinitions, ZuiComponentMap } from './types'
import { FormElementRenderer } from './ElementRenderer'

export type ZuiFormProps<UI extends UIComponentDefinitions = DefaultComponentDefinitions> = {
  schema: JSONSchema
  components: ZuiComponentMap<UI>
  value: any
  onChange: (value: any) => void
  disableValidation?: boolean
  fallback?: BoundaryFallbackComponent
  dataTransform?: (data: any) => any
}

export const ZuiForm = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>({
  schema,
  components,
  onChange,
  value,
  disableValidation,
  fallback,
  dataTransform,
}: ZuiFormProps<UI>): JSX.Element | null => {
  useEffect(() => {
    const defaults = getDefaultValues(schema)
    onChange(deepMerge(defaults, value))
  }, [JSON.stringify(schema)])

  return (
    <FormDataProvider
      formData={value}
      setFormData={onChange}
      formSchema={schema}
      disableValidation={disableValidation || false}
      dataTransform={dataTransform}
    >
      <ErrorBoundary fallback={fallback} fieldSchema={schema} path={[]}>
        <FormElementRenderer
          components={components as any}
          fieldSchema={schema}
          path={[]}
          fallback={fallback}
          required={true}
          isArrayChild={false}
        />
      </ErrorBoundary>
    </FormDataProvider>
  )
}
