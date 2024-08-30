import { FC, useEffect, useState } from 'react'
import MonacoEditor from '../MonacoEditor'
import { JSONSchema, StringSchema, NumberSchema, BooleanSchema, ObjectSchema, NullSchema, TypeOf } from '../json-schema'
import { getDefaultData } from './default-values'

type FormComponent<S extends JSONSchema> = FC<{
  schema: S
  onChange: (value: any) => void
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
  const defaultValue = getDefaultData(props.schema)

  const [value, setValue] = useState(defaultValue)

  const onChange = (newValue: string) => {
    setValue(newValue)

    const newData = newValue
    const validateResult = validate(props.schema, newData)
    if (validateResult.success) {
      props.onChange(validateResult.data)
    }
  }

  useEffect(() => {
    setValue(defaultValue)
  }, [props.schema])

  return <input type="text" onChange={(e) => onChange(e.target.value)} value={value} />
}

const NumberForm: FormComponent<NumberSchema> = (props) => {
  const defaultData = getDefaultData(props.schema)

  const toValue = (x: number) => `${x}`
  const fromValue = (x: string) => Number(x)

  const defaultValue = toValue(defaultData)
  const [value, setValue] = useState(defaultValue)

  const onChange = (newValue: string) => {
    setValue(newValue)

    const numberCasted = fromValue(newValue)
    const newData = isNaN(numberCasted) ? defaultData : numberCasted
    const validateResult = validate(props.schema, newData)
    if (validateResult.success) {
      props.onChange(validateResult.data)
    }
  }

  useEffect(() => {
    setValue(defaultValue)
  }, [props.schema])

  return <input type="number" onChange={(e) => onChange(e.target.value)} value={value} />
}

const BooleanForm: FormComponent<BooleanSchema> = (props) => {
  const defaultValue = getDefaultData(props.schema)

  const [value, setValue] = useState(defaultValue)

  const onChange = (newValue: boolean) => {
    setValue(newValue)

    const newData = newValue
    const validateResult = validate(props.schema, newData)
    if (validateResult.success) {
      props.onChange(validateResult.data)
    }
  }

  useEffect(() => {
    setValue(defaultValue)
  }, [props.schema])

  return <input type="checkbox" onChange={(e) => onChange(e.target.checked)} checked={value} />
}

const NullForm: FormComponent<NullSchema> = () => {
  return <div>null</div>
}

const AnyForm: FormComponent<JSONSchema> = (props) => {
  // @ts-ignore (ts complains about a potential infinitly deep recursion)
  const defaultData: any = getDefaultData(props.schema)
  const defaultValue: string = JSON.stringify(defaultData, null, 2)

  const [value, setValue] = useState(defaultValue)

  const onChange = (newValue: string) => {
    setValue(newValue)

    const parseResult = safeJsonParse(newValue)
    if (!parseResult.success) {
      return
    }

    const newData = parseResult.data
    const validateResult = validate(props.schema, newData)
    if (validateResult.success) {
      props.onChange(validateResult.data)
    }
  }

  useEffect(() => {
    onChange(defaultValue)
  }, [props.schema])

  return <MonacoEditor value={value} language="json" readOnly={true} onChange={(x) => onChange(x)} />
}

const OptionalForm: FormComponent<JSONSchema> = (props) => {
  const [isUndefined, setUndefined] = useState(true)

  // @ts-ignore (ts complains about a potential infinitly deep recursion)
  const defaultChildData = getDefaultData(props.schema)
  const [childFormData, setChildFormData] = useState<any>(defaultChildData)

  const onUndefinedChange = (newValue: boolean) => {
    setUndefined(newValue)
    if (newValue) {
      props.onChange(undefined)
    } else {
      props.onChange(childFormData)
    }
  }

  const onChildChange = (newValue: any) => {
    setChildFormData(newValue)
    props.onChange(newValue)
  }

  return (
    <div>
      <input type="checkbox" onChange={(e) => onUndefinedChange(!e.target.checked)} checked={!isUndefined} />
      {isUndefined ? 'undefined' : <ZuiForm schema={props.schema} onChange={onChildChange} />}
    </div>
  )
}

const ObjectForm: FormComponent<ObjectSchema> = (props) => {
  const defaultData = getDefaultData(props.schema)
  const defaultValue = defaultData
  const [value, setValue] = useState(defaultValue)

  const onChange = (x: any) => {
    setValue(x)
    const result = validate(props.schema, x)
    if (result.success) {
      props.onChange(result.data)
    }
  }

  useEffect(() => {
    onChange(defaultValue)
  }, [props.schema])

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
                onChange={(x) => {
                  onChange({
                    ...value,
                    [key]: x,
                  })
                }}
              />
            ) : (
              <ZuiForm
                schema={schema}
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
