import { FC, useState } from 'react'
import MonacoEditor from '../MonacoEditor'
import { JSONSchema, StringSchema, NumberSchema, BooleanSchema, ObjectSchema, NullSchema, TypeOf } from '../json-schema'
import { getDefaultData } from './default-values'

type FormComponent<S extends JSONSchema> = FC<{
  schema: S
  data: TypeOf<S>
  onChange: (data: TypeOf<S>) => void
}>

// type Debug = (...args: any[]) => void
// const debug: Debug = (...args) => console.log(...args)
// const debug: Debug = () => {}

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
  const [value, setValue] = useState(props.data)
  return (
    <input
      type="text"
      onChange={({ target: { value: newValue } }) => {
        setValue(newValue)
        const validateResult = validate(props.schema, newValue)
        if (!validateResult.success) {
          return
        }
        props.onChange(validateResult.data)
      }}
      value={value}
    />
  )
}

const NumberForm: FormComponent<NumberSchema> = (props) => {
  const [value, setValue] = useState(`${props.data}`)
  return (
    <input
      type="number"
      onChange={({ target: { value: newValue } }) => {
        setValue(newValue)

        const newData = Number(newValue)
        if (isNaN(newData)) {
          return
        }

        const validateResult = validate(props.schema, newData)
        if (!validateResult.success) {
          return
        }

        props.onChange(validateResult.data)
      }}
      value={value}
    />
  )
}

const BooleanForm: FormComponent<BooleanSchema> = (props) => {
  const [value, setValue] = useState(props.data)
  return (
    <input
      type="checkbox"
      onChange={({ target: { checked: newValue } }) => {
        setValue(newValue)
        const validateResult = validate(props.schema, newValue)
        if (validateResult.success) {
          props.onChange(validateResult.data)
        }
      }}
      checked={value}
    />
  )
}

const NullForm: FormComponent<NullSchema> = () => {
  return <div>null</div>
}

const AnyForm: FormComponent<JSONSchema> = (props) => {
  const [value, setValue] = useState(JSON.stringify(props.data, null, 2))
  return (
    <MonacoEditor
      value={value}
      language="json"
      readOnly={false}
      onChange={(newValue: string) => {
        setValue(newValue)

        const parseResult = safeJsonParse(newValue)
        if (!parseResult.success) {
          return
        }

        const newData = parseResult.data
        const validateResult = validate(props.schema, newData)
        if (!validateResult.success) {
          return
        }

        props.onChange(validateResult.data)
      }}
    />
  )
}

const OptionalForm: FormComponent<JSONSchema> = (props) => {
  // TODO: implement this correctly
  return <JsonForm schema={props.schema} onChange={props.onChange} data={props.data} />
}

const ObjectForm: FormComponent<ObjectSchema> = (props) => {
  const [value, setValue] = useState<any>(props.data)

  const onChange = (x: any) => {
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  return (
    <div>
      {Object.entries(props.schema.properties).map(([key, schema]) => {
        const isOptional = !props.schema.required?.includes(key)
        return (
          <div key={key} style={{ display: 'flex' }}>
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
  return <JsonForm schema={props.schema} onChange={props.onChange} data={getDefaultData(props.schema)} />
}
