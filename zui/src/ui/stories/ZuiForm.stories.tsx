import React, { FC, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { UIComponentDefinitions, ZuiComponentMap } from '../types'
import { Zui, zui as zuiImport } from '../../index'
import { ZuiForm } from '..'
import { z } from 'zod'

const zui = zuiImport as Zui<typeof exampleExtensions>

const exampleExtensions = {
  string: {
    debug: {
      id: 'debug',
      schema: z.string(),
    }
  },
  number: {
  },
  boolean: {
  },
  array: {},
  object: {
  },
} satisfies UIComponentDefinitions

const exampleSchema = zui
  .object({
    firstName: zui.string().title('User').disabled().placeholder('Enter your name').nullable(),
    lastName: zui
      .string()
      .min(3)
      .title('Last Name')
      .optional()
      .nullable(),
    dates: zui
      .array(
        zui.object({
          date: zui.string(),
          time: zui.string(),
          ids: zui.array(zui.number()),
        })
      )
      .min(1)
      .nonempty(),
    // tests the hidden function
    arandomfield: zui.string().hidden(),

    stuff: zui.object({
      birthday: zui
        .string(),
      plan: zui.enum(['basic', 'premium']),
      age: zui.number(),
      email: zui.string().title('Email Address'),
      password: zui.string(),
      passwordConfirm: zui.string(),
    }),
    debug: zui.string().displayAs('debug', ''),
  })
  .title('User Information')

const ErrorBox: FC<{ errors: z.ZodIssue[], data: any | null }> = ({ errors, data }) => errors && data !== null && <span style={{ color: 'red' }}>{errors.map(e => <p key={e.code}>{e.message}</p>)}</span>

const componentMap: ZuiComponentMap<typeof exampleExtensions> = {
  string: {
    default: ({ onChange, errors, required, label, data, zuiProps, schema }) => {
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
    debug: ({ context }) => {
      return <pre>{JSON.stringify(context.formData, null, 2)}</pre>
    }
  },
  array: {
    default: ({ children, scope, context, addItem, schema }) => <><button onClick={() => addItem()}>Add item {context.path}</button><p>{scope}</p>{children}</>,
  },
  boolean: {
    default: ({ data, enabled, label, errors, onChange }) => {
      return (
        <div style={{ padding: '1rem' }}>
          <label>
            <input type="checkbox" disabled={!enabled} checked={data || false} onChange={(e) => onChange(e.target.checked)} />
            {label}
          </label>
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  number: {
    default: ({ data, zuiProps, onChange, label, required, errors, schema }) => {
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
      return (<div style={{ padding: '1rem' }}>
        <span>{label}</span>
        <input type="number" placeholder={zuiProps?.placeholder} onChange={(e) => onChange(parseFloat(e.target.value))} value={data || 0} />
        {required && <span>*</span>}
        <ErrorBox errors={errors} data={data} />
      </div>)
    },
  },
  object: {
    default: ({ children }) => <div style={{ border: '1px solid red' }}>{children}</div>,
  },
}


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
