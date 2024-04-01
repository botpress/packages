import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import React from 'react'
import { FormError, JSONSchema } from '../types'
import ajv from 'ajv'

export type FormFieldContextProps = {
  formData: any
  formSchema: JSONSchema | any
  setFormData: (data: any) => void
  disableValidation: boolean
}

export const FormDataContext = createContext<FormFieldContextProps>({
  formData: undefined,
  formSchema: undefined,
  setFormData: () => {
    throw new Error('Must be within a FormDataProvider')
  },
  disableValidation: false,
})

export const useFormData = () => {
  const context = useContext(FormDataContext)
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider')
  }
  const compiledSchema = useMemo(() => {
    if (!context.formSchema) {
      return null
    }

    if (context.disableValidation) {
      return null
    }

    const ajvInstance = new ajv({ strictSchema: false })
    return ajvInstance.compile(context.formSchema)
  }, [context.formSchema])

  const validation = useMemo(() => {
    if (context.disableValidation) {
      return { formValid: null, formErrors: null }
    }

    if (!compiledSchema) {
      return { formValid: null, formErrors: null }
    }

    const isValid = compiledSchema(context.formData)

    if (!isValid) {
      return {
        formValid: false,
        formErrors:
          compiledSchema.errors?.map<FormError>((e) => {
            return {
              path: e.instancePath.split('/').slice(1),
              message: e.message || 'Unknown error',
            }
          }) || [],
      }
    }
    return {
      formValid: true,
      formErrors: [],
    }
  }, [compiledSchema, context.formData])

  const handlePropertyChange = (path: string, data: any) => {
    context.setFormData(setObjectPath(context.formData, path, data))
  }

  const addArrayItem = (path: string, data: any) => {
    const currentData = getPathData(context.formData, path.split('.')) || []
    context.setFormData(setObjectPath(context.formData, path, [...currentData, data]))
  }

  const removeArrayItem = (path: string, index: number) => {
    const currentData = getPathData(context.formData, path.split('.'))
    currentData.splice(index, 1)
    context.setFormData(setObjectPath(context.formData, path, currentData))
  }

  return { ...context, handlePropertyChange, addArrayItem, removeArrayItem, ...validation }
}

export function setObjectPath(obj: any, path: string, data: any): any {
  const pathArray = path.split('.')
  const pathArrayLength = pathArray.length
  pathArray.reduce((current: any, key: string, index: number) => {
    if (index === pathArrayLength - 1) {
      current[key] = data
    } else {
      if (!current[key]) {
        current[key] = isNaN(Number(key)) ? {} : []
      }
    }
    return current[key]
  }, obj)
  return { ...obj }
}

export const getDefaultItemData = (schema: JSONSchema): any => {
  if (schema.type === 'object') {
    return {}
  }
  if (schema.type === 'array') {
    return []
  }
  if (schema.type === 'string') {
    return ''
  }
  if (schema.type === 'number') {
    return 0
  }
  if (schema.type === 'boolean') {
    return false
  }
  return null
}

export const FormDataProvider: React.FC<PropsWithChildren<FormFieldContextProps>> = ({
  children,
  setFormData,
  formData,
  formSchema,
  disableValidation,
}) => {
  return (
    <FormDataContext.Provider value={{ formData, setFormData, formSchema, disableValidation }}>
      {children}
    </FormDataContext.Provider>
  )
}

export function getPathData(object: any, path: string[]): any {
  return path.reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, object)
}
