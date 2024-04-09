import React, { FC, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormError, UIComponentDefinitions, ZuiComponentMap } from '../types'
import { z } from 'zod'
import { ZuiForm } from '..'

// declare module 'zod' {
//   interface ComponentDefinitions {
//     components: typeof exampleExtensions
//   }
// }

const exampleExtensions = [
  {
    type: 'number',
    id: 'debug',
    schema: z.null(),
  }
] as const satisfies UIComponentDefinitions

const exampleSchema = z
  .object({
    field: z.string(),
    firstName: z.string().title('first name').disabled().placeholder('Enter your name').nullable(),
    lastName: z.string().min(3).title('Last Name <3').optional().nullable(),
    dates: z
      .array(
        z.object({
          date: z.string(),
          time: z.string(),
          ids: z.array(z.number()).min(2),
        }),
      )
      .min(1)
      .nonempty(),
    // tests the hidden function
    aRandomField: z.string().optional().hidden(),

    stuff: z.object({
      birthday: z.string(),
      plan: z.enum(['basic', 'premium']),
      age: z.number(),
      email: z.string().email().title('Email Address'),
      password: z.string(),
      passwordConfirm: z.string(),
    }),
    debug: z.number().optional().displayAs<typeof exampleExtensions>('default', {} as never),
  })
  .title('User Information')

const ErrorBox: FC<{ errors: FormError[]; data: any | null }> = ({ errors, data }) =>
  errors &&
  data !== null && (
    <span style={{ color: 'red' }}>
      {errors.map((e) => (
        <p key={e.path.join('')}>{e.message}</p>
      ))}
    </span>
  )

const componentMap: ZuiComponentMap<typeof exampleExtensions> = [
  {
    type: 'string',
    id: 'default',
    component: ({ onChange, errors, required, label, data, zuiProps, schema }) => {
      if (schema.enum?.length) {
        return (
          <div style={{ padding: '1rem' }}>
            <span>{label}</span>
            <select onChange={(e) => onChange(e.target.value)} value={data || ''}>
              {schema.enum.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {required && <span>*</span>}
            <ErrorBox errors={errors} data={data} />
          </div>
        )
      }
      return (
        <div style={{ padding: '1rem' }}>
          <span>{label}</span>
          <input placeholder={zuiProps?.placeholder} onChange={(e) => onChange(e.target.value)} value={data || ''} />
          {required && <span>*</span>}
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  {
    type: 'string',
    id: 'debug',
    component: ({ context }) => {
      return (
        <div>
          <pre>{JSON.stringify(context.formData, null, 2)}</pre>
          {context.formValid === null && <p>Form validation disabled</p>}
          {context.formValid === true && <p>Form is valid</p>}
          {context.formValid === false && (
            <div>
              <p>Form is invalid with {context.formErrors?.length} errors:</p>
              <ul>
                {context.formErrors?.map((e) => (
                  <li key={e.path.join('.')}>
                    {e.path.join('.')} - {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    },
  },
  {
    type: 'array',
    id: 'default',
    component: ({ children, scope, context, addItem, errors }) => (
      <>
        <button onClick={() => addItem()}>Add item {context.path}</button>
        <p>{scope}</p>
        {children}
        <ErrorBox errors={errors} data={null} />
      </>
    ),
  },
  {
    type: 'boolean',
    id: 'default',
    component: ({ data, enabled, label, errors, onChange }) => {
      return (
        <div style={{ padding: '1rem' }}>
          <label>
            <input
              type="checkbox"
              disabled={!enabled}
              checked={data || false}
              onChange={(e) => onChange(e.target.checked)}
            />
            {label}
          </label>
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  {
    type: 'number',
    id: 'default',
    component: ({ data, zuiProps, onChange, label, required, errors, schema }) => {
      if (schema.enum?.length) {
        return (
          <div style={{ padding: '1rem' }}>
            <span>{label}</span>
            <select onChange={(e) => onChange(e.target.value)} value={data || 0}>
              {schema.enum.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {required && <span>*</span>}
            <ErrorBox errors={errors} data={data} />
          </div>
        )
      }
      return (
        <div style={{ padding: '1rem' }}>
          <span>{label}</span>
          <input
            type="number"
            placeholder={zuiProps?.placeholder}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            value={data || 0}
          />
          {required && <span>*</span>}
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  {
    type: 'object',
    id: 'default',
    component: ({ children, errors, data, ...rest }) => {
      return (
        <section>
          <div style={{ border: '1px solid red' }}>{children}</div>
          {rest.isArrayChild === true && <button onClick={() => rest.removeSelf()}>delete</button>}
          {!!errors?.length && <ErrorBox errors={errors} data={data} />}
        </section>
      )
    },
  },
];

const ZuiFormExample = () => {
  const [formData, setFormData] = useState({})
  return (
    <ZuiForm<typeof exampleExtensions>
      schema={exampleSchema.toJsonSchema({
        target: 'openApi3',
      })}
      value={formData}
      onChange={setFormData}
      components={componentMap}
      disableValidation={false}
    />
  )
}
const meta = {
  title: 'Form/Example',
  component: ZuiFormExample,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiFormExample>

type Story = StoryObj<typeof meta>

export const ExampleSchema: Story = {
  args: {},
}

export default meta
