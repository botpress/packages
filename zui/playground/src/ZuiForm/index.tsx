import { FC, useEffect, useState } from 'react'
import MonacoEditor from '../MonacoEditor'
import { JSONSchema, StringSchema, NumberSchema, BooleanSchema, ObjectSchema, NullSchema, TypeOf } from '../json-schema'
import { getDefaultData } from './default-values'
import { validate } from './validate'

type FormComponent<S extends JSONSchema> = FC<{
  schema: S
  data: TypeOf<S>
  onChange: (data: TypeOf<S>) => void
}>

// type Debug = (...args: any[]) => void
// const debug: Debug = (...args) =>
// const debug: Debug = () => {}

const red: React.CSSProperties = { color: 'red' }
const flex: React.CSSProperties = { display: 'flex' }

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
  const [formState, setFormState] = useState({
    value: props.data,
    error: undefined as string | undefined,
  })

  useEffect(() => {
    setFormState({
      value: props.data,
      error: undefined,
    })
  }, [props.data])

  const { value, error } = formState
  const errorMessage = error ?? ''

  return (
    <div style={flex}>
      <input
        type="text"
        onChange={({ target: { value: newValue } }) => {
          const validateResult = validate(props.schema, newValue)
          if (!validateResult.success) {
            setFormState({
              value: newValue,
              error: validateResult.error,
            })
            return
          }
          setFormState({
            value: newValue,
            error: undefined,
          })
          props.onChange(validateResult.data)
        }}
        value={value}
      />
      <div style={red}>{errorMessage}</div>
    </div>
  )
}

const NumberForm: FormComponent<NumberSchema> = (props) => {
  const [formState, setFormState] = useState({
    value: `${props.data}`,
    error: undefined as string | undefined,
  })

  useEffect(() => {
    setFormState({
      value: `${props.data}`,
      error: undefined,
    })
  }, [props.data])

  const { value, error } = formState
  const errorMessage = error ?? ''
  return (
    <div style={flex}>
      <input
        type="number"
        onChange={({ target: { value: newValue } }) => {
          const newData = Number(newValue)

          if (isNaN(newData)) {
            setFormState({
              value: newValue,
              error: 'Not a number',
            })
            return
          }

          const validateResult = validate(props.schema, newData)
          if (!validateResult.success) {
            setFormState({
              value: newValue,
              error: validateResult.error,
            })
            return
          }

          setFormState({
            value: newValue,
            error: undefined,
          })
          props.onChange(validateResult.data)
        }}
        value={value}
      />
      <div style={red}>{errorMessage}</div>
    </div>
  )
}

const BooleanForm: FormComponent<BooleanSchema> = (props) => {
  const [formState, setFormState] = useState({
    value: props.data,
    error: undefined as string | undefined,
  })

  useEffect(() => {
    setFormState({
      value: props.data,
      error: undefined,
    })
  }, [props.data])

  const { value, error } = formState
  const errorMessage = error ?? ''
  return (
    <div style={flex}>
      <input
        type="checkbox"
        onChange={({ target: { checked: newValue } }) => {
          const validateResult = validate(props.schema, newValue)
          if (!validateResult.success) {
            setFormState({
              value: newValue,
              error: validateResult.error,
            })
            return
          }
          setFormState({
            value: newValue,
            error: undefined,
          })
          props.onChange(validateResult.data)
        }}
        checked={value}
      />
      <div style={red}>{errorMessage}</div>
    </div>
  )
}

const NullForm: FormComponent<NullSchema> = () => {
  return <div>null</div>
}

const AnyForm: FormComponent<JSONSchema> = (props) => {
  const [formState, setFormState] = useState({
    value: JSON.stringify(props.data, null, 2),
    error: undefined as string | undefined,
  })

  useEffect(() => {
    setFormState({
      value: JSON.stringify(props.data, null, 2),
      error: undefined,
    })
  }, [props.data])

  const { value, error } = formState
  const errorMessage = error ?? ''

  return (
    <div>
      <MonacoEditor
        value={value}
        language="json"
        readOnly={false}
        onChange={(newValue: string) => {
          const parseResult = safeJsonParse(newValue)
          if (!parseResult.success) {
            setFormState({
              value: newValue,
              error: parseResult.error,
            })
            return
          }

          const newData = parseResult.data
          const validateResult = validate(props.schema, newData)
          if (!validateResult.success) {
            setFormState({
              value: newValue,
              error: validateResult.error,
            })
            return
          }

          setFormState({
            value: newValue,
            error: undefined,
          })
          props.onChange(validateResult.data)
        }}
      />
      <div style={red}>{errorMessage}</div>
    </div>
  )
}

const OptionalForm: FormComponent<JSONSchema> = (props) => {
  // TODO: implement this correctly
  return <JsonForm schema={props.schema} onChange={props.onChange} data={props.data} />
}

const ObjectForm: FormComponent<ObjectSchema> = (props) => {
  const [formState, setFormState] = useState({
    value: props.data,
    error: undefined as string | undefined,
  })

  useEffect(() => {
    setFormState({
      value: props.data,
      error: undefined,
    })
  }, [props.data])

  const onChange = (x: Record<string, any>) => {
    const result = validate(props.schema, x)
    if (!result.success) {
      setFormState({
        value: x,
        error: result.error,
      })
      return
    }

    setFormState({
      value: x,
      error: undefined,
    })
    props.onChange(result.data)
  }

  const { value, error } = formState
  const errorMessage = error ?? ''

  return (
    <div>
      <div>
        {Object.entries(props.schema.properties).map(([key, schema]) => {
          const isOptional = !props.schema.required?.includes(key)
          return (
            <div key={key} style={flex}>
              <div>{key}</div>
              {isOptional ? (
                <OptionalForm
                  schema={schema}
                  data={value[key]}
                  onChange={(x) => {
                    onChange({
                      ...value,
                      [key]: x,
                    })
                  }}
                />
              ) : (
                <JsonForm
                  schema={schema}
                  data={value[key]}
                  onChange={(x) => {
                    onChange({
                      ...value,
                      [key]: x,
                    })
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div style={red}>{errorMessage}</div>
    </div>
  )
}

const JsonForm: FormComponent<JSONSchema> = (props) => {
  if (props.schema.type === 'string') {
    return <StringForm schema={props.schema} onChange={props.onChange} data={props.data} />
  }

  if (props.schema.type === 'number' || props.schema.type === 'integer') {
    return <NumberForm schema={props.schema} onChange={props.onChange} data={props.data} />
  }

  if (props.schema.type === 'boolean') {
    return <BooleanForm schema={props.schema} onChange={props.onChange} data={props.data} />
  }

  if (props.schema.type === 'null') {
    return <NullForm schema={props.schema} onChange={props.onChange} data={props.data} />
  }

  if (props.schema.type === 'object' && props.schema.properties !== undefined) {
    return <ObjectForm schema={props.schema} onChange={props.onChange} data={props.data} />
  }

  return <AnyForm schema={props.schema} onChange={props.onChange} data={props.data} />
}

export const ZuiForm: FC<{ schema: JSONSchema; onChange: (data: any) => void }> = (props) => {
  const [formState, setFormState] = useState<{
    schema: JSONSchema
    data: any
  }>()

  useEffect(() => {
    const defaultData = getDefaultData(props.schema)
    setFormState({
      schema: props.schema,
      data: defaultData,
    })
  }, [props.schema])

  if (formState === undefined) {
    return null
  }

  const { schema, data } = formState
  return (
    <JsonForm
      schema={schema}
      data={data}
      onChange={(x) => {
        setFormState({
          schema,
          data: x,
        })
        props.onChange(x)
      }}
    />
  )
}
