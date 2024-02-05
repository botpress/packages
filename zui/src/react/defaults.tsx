import React from 'react'
import { z } from 'zod'
import type { ZUIComponentLibrary, ZUIComponent } from './types'
import { UIExtension } from '../uiextensions'

export const commonHTMLInputSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  disabled: z.boolean().default(false).optional(),
  readonly: z.boolean().default(false).optional(),
  hidden: z.boolean().default(false).optional(),
  autofocus: z.boolean().default(false).optional(),
  required: z.boolean().default(false).optional(),
  placeholder: z.string().optional(),
})

export const defaultExtensions = {
  string: {
    textbox: {
      id: 'textbox',
      schema: commonHTMLInputSchema.extend({
        type: z.enum(['text', 'password', 'email', 'tel', 'url']).default('text'),
        default: z.string().optional(),
        maxLength: z.number().optional(),
        minLength: z.number().optional(),
        pattern: z.string().optional(),
      }),
    },
    select: {
      id: 'select',
      schema: commonHTMLInputSchema.extend({
        default: z.string().optional(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string(),
        })).optional(),
      }),
    },
    datetimeinput: {
      id: 'datetimeinput',
      schema: commonHTMLInputSchema.extend({
        type: z.enum(['datetime-local', 'date', 'week']).default('datetime-local'),
        default: z.string().optional(),
        min: z.string().optional(),
        max: z.string().optional(),
      }),
    },
  },
  number: {
    numberinput: {
      id: 'numberinput',
      schema: commonHTMLInputSchema.extend({
        type: z.literal('number'),
        default: z.number().optional().default(0),
        min: z.number().optional().default(0),
        max: z.number().optional(),
        step: z.number().default(0).optional(),
      }),
    },
    slider: {
      id: 'slider',
      schema: commonHTMLInputSchema.extend({
        type: z.literal('range'),
        default: z.number().optional().default(0),
        min: z.number().optional().default(0),
        max: z.number().optional(),
        step: z.number().default(0).optional(),
      }),
    },
  },
  boolean: {
    checkbox: {
      id: 'checkbox',
      schema: commonHTMLInputSchema.extend({
        default: z.boolean().default(false).optional(),
      }),
    },
  },
  array: {
  },
  object: {
  },
} as const satisfies UIExtension

const TextBox: ZUIComponent<'string', 'textbox', typeof defaultExtensions> = ({ params }) => {
  return <input style={{ display: 'flex' }} {...params} />
}

const NumberSlider: ZUIComponent<'number', 'slider', typeof defaultExtensions> = ({ params }) => {
  return <input style={{ display: 'flex' }} {...params} />
}

const DatetimeInput: ZUIComponent<'string', 'datetimeinput', typeof defaultExtensions> = ({ params }) => {
  return <input style={{ display: 'flex' }} {...params} />
}

const NumberInput: ZUIComponent<'number', 'numberinput', typeof defaultExtensions> = ({ params }) => {
  return <input style={{ display: 'flex' }} {...params} />
}

const BooleanCheckbox: ZUIComponent<'boolean', 'checkbox', typeof defaultExtensions> = ({ params }) => {
  return <input style={{ display: 'flex' }} {...params} />
}

const SelectList: ZUIComponent<'string', 'select', typeof defaultExtensions> = ({ params }) => {
  return (
    <select {...params} defaultValue={params.default}>
      {params.options?.map((option) => (
        <option value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}

export const defaultComponentLibrary: ZUIComponentLibrary<typeof defaultExtensions> = {
  string: {
    textbox: TextBox,
    select: SelectList,
    datetimeinput: DatetimeInput,
  },
  number: {
    slider: NumberSlider,
    numberinput: NumberInput,
  },
  boolean: {
    checkbox: BooleanCheckbox,
  },
  array: {},
  object: {
    default: ({ children }) => <div style={{
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      flexDirection: 'column',
      padding: '0.4rem',
      margin: '0.2rem',
      gap: '0.5rem',
      boxSizing: 'border-box'
    }}>{children}</div>,
  },
}
