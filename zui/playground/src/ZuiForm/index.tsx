import { FC, useState } from 'react'
import MonacoEditor from '../MonacoEditor'
import { getDefaultValues } from '../../../src/ui/hooks/useFormData'
import {
  JSONSchema,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  NullSchema,
  AnySchema,
  ObjectSchema,
  ArraySchema,
  TupleSchema,
  RecordSchema,
} from '../../../src/json-schema'

type FormComponent<S extends JSONSchema> = FC<{
  schema: S
  onChange: (value: any) => void
}>

const validate = (schema: JSONSchema, data: any): { success: true; data: any } | { success: false; error: string } => ({
  success: true,
  data: data,
})

const safeJsonParse = (x: string): { success: true; data: any } | { success: false; error: string } => {
  try {
    return {
      success: true,
      data: JSON.parse(x),
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(`${thrown}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

const StringForm: FormComponent<StringSchema> = (props) => {
  const [value, setValue] = useState(getDefaultValues(props.schema))
  return (
    <input
      type="text"
      onChange={(e) => {
        setValue(e.target.value)
        const result = validate(props.schema, e.target.value)
        if (result.success) {
          props.onChange(result.data)
        }
      }}
      value={value}
    />
  )
}

const NumberForm: FormComponent<NumberSchema> = (props) => {
  const [value, setValue] = useState(getDefaultValues(props.schema))
  return (
    <input
      type="number"
      onChange={(e) => {
        const value = Number(e.target.value)
        if (isNaN(value)) {
          return
        }
        setValue(value)
        const result = validate(props.schema, e.target.value)
        if (result.success) {
          props.onChange(result.data)
        }
      }}
      value={value}
    />
  )
}

const BooleanForm: FormComponent<BooleanSchema> = (props) => {
  const [value, setValue] = useState(getDefaultValues(props.schema))
  return (
    <input
      type="checkbox"
      onChange={(e) => {
        setValue(e.target.checked)
        const result = validate(props.schema, e.target.checked)
        if (result.success) {
          props.onChange(result.data)
        }
      }}
      checked={value}
    />
  )
}

const NullForm: FormComponent<NullSchema> = (props) => {
  return null
}

// json editor
const AnyForm: FormComponent<JSONSchema> = (props) => {
  const [stringified, setStringified] = useState(getDefaultValues(props.schema))
  return (
    <MonacoEditor
      value={stringified}
      language="json"
      readOnly={true}
      onChange={(x) => {
        setStringified(x)
        const parseResult = safeJsonParse(x)
        if (!parseResult.success) {
          return
        }

        const result = validate(props.schema, parseResult.data)
        if (!result.success) {
          return
        }

        props.onChange(parseResult.data)
      }}
    />
  )
}

const ObjectForm: FormComponent<ObjectSchema> = (props) => {
  const [value, setValue] = useState<{ [key: string]: any }>(getDefaultValues(props.schema))
  return (
    <div>
      {Object.entries(props.schema.properties).map(([key, schema]) => {
        return (
          <div style={{ display: 'flex' }}>
            <div>{key}</div>
            <ZuiForm
              schema={schema}
              onChange={(x) => {
                setValue({
                  ...value,
                  [key]: x,
                })
                const result = validate(props.schema, value)
                if (result.success) {
                  props.onChange(result.data)
                }
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export const ZuiForm: FormComponent<JSONSchema> = (props) => {
  if (props.schema.type === 'string') {
    return <StringForm schema={props.schema} onChange={props.onChange} />
  }

  if (props.schema.type === 'number' || props.schema.type === 'integer') {
    return <NumberForm schema={props.schema} onChange={props.onChange} />
  }

  if (props.schema.type === 'boolean') {
    return <BooleanForm schema={props.schema} onChange={props.onChange} />
  }

  if (props.schema.type === 'null') {
    return <NullForm schema={props.schema} onChange={props.onChange} />
  }

  if (props.schema.type === 'object' && props.schema.properties !== undefined) {
    return <ObjectForm schema={props.schema} onChange={props.onChange} />
  }

  return <AnyForm schema={props.schema} onChange={props.onChange} />
}
