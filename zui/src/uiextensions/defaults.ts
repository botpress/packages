import { z } from 'zod'
import { type UIExtension } from '.'

export const commonHTMLInputSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  disabled: z.boolean().default(false).optional(),
  readonly: z.boolean().default(false).optional(),
  hidden: z.boolean().default(false).optional(),
  autofocus: z.boolean().default(false).optional(),
  required: z.boolean().default(false).optional(),
})

export const defaultExtensions = {
  string: {
    textbox: {
      id: 'textbox',
      schema: commonHTMLInputSchema.extend({
        type: z.enum(['text', 'password', 'email', 'tel', 'url', 'color', 'time']).default('text'),
        default: z.string().optional(),
        maxLength: z.number().optional(),
        minLength: z.number().optional(),
        pattern: z.string().optional(),
        placeholder: z.string().optional(),
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
  array: {},
  object: {},
} as const satisfies UIExtension
