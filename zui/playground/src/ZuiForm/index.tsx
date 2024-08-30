import { FC, useEffect, useState } from 'react'
import MonacoEditor from '../MonacoEditor'
import { JSONSchema, StringSchema, NumberSchema, BooleanSchema, ObjectSchema, NullSchema } from '../json-schema'
import { getDefaultValues } from './default-values'

type FormComponent<S extends JSONSchema> = FC<{
  schema: S
  onChange: (value: any) => void
}>

type Debug = (...args: any[]) => void
// const debug: Debug = (...args) => console.log(...args)
const debug: Debug = () => {}

const validate = (
  _schema: JSONSchema,
  data: any,
): { success: true; data: any } | { success: false; error: string } => ({
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

  const onChange = (x: any) => {
    debug('### StringForm Change', x)
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  useEffect(() => {
    onChange(getDefaultValues(props.schema))
  }, [props.schema])

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

  const onChange = (x: any) => {
    debug('### NumberForm Change', x)
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  useEffect(() => {
    onChange(getDefaultValues(props.schema))
  }, [props.schema])

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

  const onChange = (x: any) => {
    debug('### BooleanForm Change', x)
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  useEffect(() => {
    onChange(getDefaultValues(props.schema))
  }, [props.schema])

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

const NullForm: FormComponent<NullSchema> = () => {
  return null
}

// json editor
const AnyForm: FormComponent<JSONSchema> = (props) => {
  const [value, setValue] = useState(getDefaultValues(props.schema))

  const onChange = (x: any) => {
    debug('### AnyForm Change', x)
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  useEffect(() => {
    onChange(getDefaultValues(props.schema))
  }, [props.schema])

  return (
    <MonacoEditor
      value={value}
      language="json"
      readOnly={true}
      onChange={(x) => {
        setValue(x)
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
  const [value, setValue] = useState(getDefaultValues(props.schema))

  const onChange = (x: any) => {
    debug('### ObjectForm Change', x)
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  useEffect(() => {
    onChange(getDefaultValues(props.schema))
  }, [props.schema])

  return (
    <div>
      {Object.entries(props.schema.properties).map(([key, schema]) => {
        return (
          <div key={key} style={{ display: 'flex' }}>
            <div>{key}</div>
            <ZuiForm
              schema={schema}
              onChange={(x) => {
                onChange({
                  ...value,
                  [key]: x,
                })
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
