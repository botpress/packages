import { z } from 'zod'
import { createComponent } from '.'

export const commonHTMLInputSchema = z.object({
  id: z.string().optional(),
  disabled: z.boolean().default(false).optional(),
  readonly: z.boolean().default(false).optional(),
  hidden: z.boolean().default(false).optional(),
  autofocus: z.boolean().default(false).optional(),
  required: z.boolean().default(false).optional(),
})

export const defaultExtensions = {
  string: [
    createComponent(
      'input',
      commonHTMLInputSchema.extend({
        type: z.enum(['text', 'password', 'email', 'tel', 'url']).default('text'),
        default: z.string().optional(),
        maxLength: z.number().optional(),
        minLength: z.number().optional(),
        pattern: z.string().optional(),
        placeholder: z.string().optional(),
      }),
    ),
  ],
  number: [
    createComponent(
      'number',
      commonHTMLInputSchema.extend({
        type: z.enum(['number', 'range']).default('number'),
        default: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional(),
      }),
    ),
  ],
  boolean: [
    createComponent(
      'checkbox',
      commonHTMLInputSchema.extend({
        default: z.boolean().default(false).optional(),
      }),
    ),
  ],
  object: [],
  array: [],
} as const
