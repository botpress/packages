import { fireEvent, render } from '@testing-library/react'
import { ZuiForm, ZuiFormProps } from './index'
import { ZuiComponentMap } from '../index'
import { ObjectSchema, JSONSchema, ZuiReactComponentBaseProps, BaseType, UIComponentDefinitions } from './types'
import { FC, PropsWithChildren, useState } from 'react'
import { vi } from 'vitest'
import { z as zui } from 'zod'

const TestId = (type: JSONSchema['type'], path: string[], subpath?: string) =>
  `${type}:${path.length > 0 ? path.join('.') : 'root'}${subpath ? `:${subpath}` : ''}`

describe('UI', () => {
  it('renders a simple form from a json schema', () => {
    const jsonSchema: ObjectSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
      required: ['firstName', 'lastName'],
      additionalProperties: false,
    }
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => { }}
      />,
    )

    for (const key in jsonSchema.properties) {
      const element = rendered.getByTestId(TestId('string', [key]))
      expect(element).toBeTruthy()
    }
  })

  it('renders a simple form from a zui schema', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(child.type, path))
      expect(element).toBeTruthy()
    })
  })

  it('renders a multi-level form from a zui schema', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      address: zui.object({
        street: zui.string(),
        city: zui.string(),
        state: zui.string(),
        zip: zui.string(),
      }),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(child.type, path))
      expect(element).toBeTruthy()
    })
  })

  it('renders correctly with no default component implementation', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      age: zui.number(),
      address: zui.object({
        street: zui.string(),
        city: zui.string(),
        state: zui.string(),
        zip: zui.number(),
      }),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const components = { ...testComponentImplementation, number: { default: () => null } }

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={components}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      if (child.type === 'number') {
        const element = rendered.queryByTestId(TestId(child.type, path))
        expect(element).toBeFalsy()
      }
      if (child.type === 'string') {
        const element = rendered.getByTestId(TestId(child.type, path))
        expect(element).toBeTruthy()
      }
    })
  })

  it('renders correctly with a multi-level form with arrays', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      age: zui.number(),
      address: zui.object({
        street: zui.string(),
        city: zui.string(),
        state: zui.string(),
        zip: zui.number(),
      }),
      children: zui.array(
        zui.object({
          firstName: zui.string(),
          lastName: zui.string(),
          age: zui.number(),
          favoriteColors: zui.array(zui.string()),
        }),
      ),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{ children: [{ favoriteColors: [''] }] }}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(child.type, path))
      expect(element).toBeTruthy()
    })
  })

  it('adds a default string array item correctly', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')
    fireEvent.click(addBtn)

    const element = rendered.queryByTestId('string:favoriteColors.0:input')
    expect(element).toBeTruthy()

    expect(rendered.queryByTestId('string:favoriteColors.0')?.getAttribute('data-ischild')).toBe('true')
    expect(rendered.queryByTestId('string:favoriteColors.0')?.getAttribute('data-index')).toBe('0')
  })

  it('receives the correct subschemas for each nested object of different types', () => {
    const aDeeplyNestedSchema = zui.object({
      likesPizza: zui.boolean(),
      deeplyNested: zui.object({
        nested: zui.object({
          nestedagain: zui.object({
            firstName: zui.string(),
            lastName: zui.string(),
          }),
          age: zui.number(),
        }),
      }),
      vector: zui.array(zui.number()),
    })

    const jsonSchema = aDeeplyNestedSchema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)
    const addButton = rendered.getByTestId('array:vector:addbtn')
    fireEvent.click(addButton)

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(child.type, path))
      expect(element).toBeTruthy()

      const schemaElement = rendered.getByTestId(TestId(child.type, path, 'schema'))

      expect(schemaElement).toBeTruthy()
      expect(JSON.parse(schemaElement.innerHTML)).toEqual(child)
    })
  })

  it('handles adding 50 elements to an array', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')
    for (let i = 0; i < 50; i++) {
      fireEvent.click(addBtn)
    }

    const elements = rendered.getByTestId('array:favoriteColors:container').children
    expect(elements).toHaveLength(50)
  })
  it('handles removing an element from an array implementation', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')
    fireEvent.click(addBtn)

    const removeBtn = rendered.getByTestId('array:favoriteColors:removebtn')
    fireEvent.click(removeBtn)

    const element = rendered.queryByTestId('string:favoriteColors.0')
    expect(element).toBeFalsy()
  })

  it('handles removing from a child element within an array', () => {
    const schema = zui.object({
      favoriteColors: zui.array(
        zui.object({
          name: zui.string(),
          rating: zui.number(),
          color: zui.string(),
        }),
      ),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')

    for (let i = 0; i < 20; i++) {
      fireEvent.click(addBtn)
      const input = rendered.getByTestId(`string:favoriteColors.${i}.color:input`)
      fireEvent.change(input, { target: { value: `${i}` } })
    }

    const removeBtn = rendered.getByTestId('object:favoriteColors.5:removeselfbtn')
    fireEvent.click(removeBtn)

    expect(rendered.queryByDisplayValue('5')).toBeFalsy()
  })

  it('renders array elements with the correct index even after update', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')

    for (let i = 0; i < 20; i++) {
      fireEvent.click(addBtn)
    }

    for (let i = 0; i < 20; i++) {
      const element = rendered.getByTestId(`string:favoriteColors.${i}`)
      expect(element).toBeTruthy()
      expect(element.getAttribute('data-index')).toBe(i.toString())
    }

    const removeBtn = rendered.getByTestId('string:favoriteColors.5:removeselfbtn')
    fireEvent.click(removeBtn)

    for (let i = 0; i < 19; i++) {
      const element = rendered.getByTestId(`string:favoriteColors.${i}`)
      expect(element).toBeTruthy()
      expect(element.getAttribute('data-index')).toBe(i.toString())
    }
  })

  it('calls onChange with the correct data', () => {
    const onChangeMock = vi.fn()

    const schema = zui.object({
      students: zui.array(
        zui.object({
          name: zui.string(),
          age: zui.number(),
        }),
      ),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{ students: [{ name: 'John', age: 20 }] }}
        onChange={onChangeMock}
      />,
    )

    const input = rendered.getByTestId('string:students.0.name:input')
    fireEvent.change(input, { target: { value: 'Jane' } })

    expect(onChangeMock).toHaveBeenCalledTimes(1)
    expect(onChangeMock).toHaveBeenCalledWith({ students: [{ name: 'Jane', age: 20 }] })
  })

  it('it renders custom zui components with correct params as input', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      customField: zui.string().displayAs('customstringcomponent', { multiline: true }),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    const customInput = rendered.getByTestId('string:customField:custominput')
    expect(customInput).toBeTruthy()

    const params = rendered.getByTestId('string:customField:params')
    expect(params.innerHTML).toBe(JSON.stringify({ multiline: true }, null, 2))
  })

  it('passes the correct zui props to components', () => {
    const schema = zui.object({
      somefield: zui
        .string()
        .title('First Name')
        .placeholder('Enter your first name')
        .displayAs('customstringcomponent', { multiline: false })
        .disabled()
        .hidden(false),
      lastName: zui.string().title('Last Name'),
    })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    const firstNameInput = rendered.getByTestId('string:somefield:zuiprops')

    expect(JSON.parse(firstNameInput.innerHTML)).toEqual({
      title: 'First Name',
      placeholder: 'Enter your first name',
      disabled: true,
      hidden: false,
      displayAs: ['customstringcomponent', { multiline: false }],
    })
  })

  it('render multilevel arrays with custom components correctly', () => {
    const schema = zui
      .object({
        kids: zui.array(
          zui.object({
            name: zui.string(),
            toys: zui.array(zui.string()).displayAs('stringList', {}),
          }),
        ),
      })
      .displayAs('collapsible', { collapsed: true })

    const jsonSchema = schema.toJsonSchema({ target: 'jsonSchema7' }) as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{ kids: [{ toys: [''] }] }}
        onChange={() => console.log()}
      />,
    )

    const addBtn = rendered.getByTestId('stringlistelement:addbtn')

    expect(addBtn).toBeTruthy()

    fireEvent.click(addBtn)

    const element = rendered.queryByTestId('stringlistelement:0')

    expect(element).toBeTruthy()
  })
})
const testComponentDefinitions = [
  {
    type: 'string',
    id: 'customstringcomponent',
    schema: zui.object({ multiline: zui.boolean() }),
  },
  {
    type: 'number',
    id: 'number',
    schema: zui.object({}),
  },
  {
    type: 'boolean',
    id: 'boolean',
    schema: zui.object({}),
  },
  {
    type: 'array',
    id: 'stringList',
    schema: zui.object({}),
  },
  {
    type: 'object',
    id: 'collapsible',
    schema: zui.object({ collapsed: zui.boolean() }),
  },
] as const satisfies UIComponentDefinitions

const ZuiFormWithState: FC<Omit<ZuiFormProps, 'onChange' | 'value'>> = (props) => {
  const [state, setState] = useState({})
  return <ZuiForm {...props} value={state} onChange={(data) => setState(data)} />
}

const TestWrapper: FC<PropsWithChildren<ZuiReactComponentBaseProps<BaseType, any>>> = ({
  children,
  type,
  scope,
  schema,
  params,
  ...props
}) => {
  return (
    <div
      data-testid={`${type}:${scope}`}
      data-componentid={props.componentID}
      data-elementdata={props.data}
      data-label={props.label}
      data-ischild={props.isArrayChild}
      data-index={props.isArrayChild ? props.index : undefined}
    >
      <section data-testid={`${type}:${scope}:container`}>{children}</section>
      <script type="application/json" data-testid={`${type}:${scope}:schema`}>
        {JSON.stringify(schema, null, 2)}
      </script>
      <script type="application/json" data-testid={`${type}:${scope}:params`}>
        {JSON.stringify(params, null, 2)}
      </script>
      <script type="application/json" data-testid={`${type}:${scope}:zuiprops`}>
        {JSON.stringify(props.zuiProps || {}, null, 2)}
      </script>
      {props.isArrayChild ? (
        <button data-testid={`${type}:${scope}:removeselfbtn`} onClick={() => props.removeSelf()}>
          Remove self
        </button>
      ) : null}
    </div>
  )
}

const testComponentImplementation: ZuiComponentMap<typeof testComponentDefinitions> = [
  {
    type: 'string',
    id: 'customstringcomponent',
    component: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            data-testid={`${props.type}:${props.scope}:custominput`}
            value={props.data || ''}
            onChange={(e) => props.onChange(e.target.value)}
          />
        </TestWrapper>
      )
    },
  },
  {
    type: 'string',
    id: 'default',
    component: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            data-testid={`${props.type}:${props.scope}:input`}
            value={props.data || ''}
            onChange={(e) => props.onChange(e.target.value)}
          />
        </TestWrapper>
      )
    },
  },
  {
    type: 'number',
    id: 'default',
    component: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            type="number"
            data-testid={`${props.type}:${props.scope}:input`}
            value={props.data || ''}
            onChange={(e) => props.onChange(parseFloat(e.target.value))}
          />
        </TestWrapper>
      )
    },
  },
  {
    type: 'boolean',
    id: 'default',
    component: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            type="checkbox"
            data-testid={`${props.type}:${props.scope}:input`}
            checked={props.data || false}
            onChange={(e) => props.onChange(Boolean(e.target.value))}
          />
        </TestWrapper>
      )
    },
  },
  {
    type: 'object',
    id: 'collapsible',
    component: (props) => {
      return (
        <TestWrapper {...props}>
          <details data-iscollapsible>
            <summary>Collapsible</summary>
            {props.children}
          </details>
        </TestWrapper>
      )
    },
  },
  {
    type: 'object',
    id: 'default',
    component: (props) => {
      return <TestWrapper {...props}>{props.children}</TestWrapper>
    },
  },
  {
    type: 'array',
    id: 'stringList',
    component: (props) => {
      const childrens = Array.isArray(props.children) ? props.children : [props.children]
      return (
        <TestWrapper {...props}>
          <button data-testid="stringlistelement:addbtn" onClick={() => props.addItem('')}>
            Add item
          </button>
          {childrens.map((child, index) => (
            <div key={child.key} data-testid={`stringlistelement:${index}`}>
              <span key={index}>{child}</span>
              <button onClick={() => props.removeItem(index)}>-</button>
            </div>
          ))}
        </TestWrapper>
      )
    },
  },
  {
    type: 'array',
    id: 'default',
    component: ({ type, scope, children, addItem, removeItem, schema }) => {
      return (
        <div data-testid={`${type}:${scope}`}>
          <section data-testid={`${type}:${scope}:container`}>{children}</section>
          <button data-testid={`${type}:${scope}:addbtn`} onClick={() => addItem()}>
            Add Item
          </button>
          <button data-testid={`${type}:${scope}:removebtn`} onClick={() => removeItem(0)}>
            Remove first
          </button>
          <script type="application/json" data-testid={`${type}:${scope}:schema`}>
            {JSON.stringify(schema, null, 2)}
          </script>
        </div>
      )
    },
  },
]

const traverseSchemaTest = (schema: JSONSchema, callback: (path: string[], child: JSONSchema) => void) => {
  const traverse = (path: string[], child: JSONSchema) => {
    if (child.type === 'object') {
      for (const [key, value] of Object.entries(child.properties)) {
        traverse([...path, key], value)
      }
    }
    if (child.type === 'array') {
      traverse([...path, '0'], child.items!)
    }
    callback(path, child)
  }
  return traverse([], schema)
}
