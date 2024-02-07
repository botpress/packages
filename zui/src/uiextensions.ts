import { ZodSchema, ZodType, z } from 'zod'

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'
export type ContainerType = 'object' | 'array'

export type UIExtension = {
  [type in BaseType]: {
    [id: string | number | symbol]: {
      id: string
      schema: ZodSchema
    }
  }
}

export interface UIExtensionDefinition {}

export type GlobalExtensionDefinition = UIExtensionDefinition extends {
  extensions: infer TExtensions extends UIExtension
}
  ? TExtensions
  : any

export type ZodToBaseType<T extends ZodType> = T extends z.ZodString
  ? 'string'
  : T extends z.ZodBoolean
  ? 'boolean'
  : T extends z.ZodNumber
  ? 'number'
  : T extends z.ZodArray<any, any>
  ? 'array'
  : T extends z.ZodObject<any, any>
  ? 'object'
  : any

export const commonInputSchema = z.object({
  scope: z.string().includes('#/properties/'),
  label: z.string().optional(),
  readonly: z.boolean().optional(),
})

export const defaultExtensions = {
  string: {
    textbox: {
      id: 'textbox',
      schema: commonInputSchema.extend({
        multiline: z.boolean().default(false).optional(),
        fitContentWidth: z.boolean().default(false).optional(),
      }),
    },
    datetimeinput: {
      id: 'datetimeinput',
      schema: commonInputSchema.extend({
        type: z.enum(['time', 'date', 'date-time']).default('date-time'),
      }),
    },
  },
  number: {
    numberinput: {
      id: 'numberinput',
      schema: commonInputSchema,
    },
    slider: {
      id: 'slider',
      schema: commonInputSchema,
    },
  },
  boolean: {
    checkbox: {
      id: 'checkbox',
      schema: commonInputSchema,
    },
  },
  array: {
    select: {
      id: 'select',
      schema: z.undefined(),
    },
  },
  object: {
    verticalLayout: {
      id: 'verticalLayout',
      schema: z.undefined(),
    },
    horizontalLayout: {
      id: 'horizontalLayout',
      schema: z.undefined(),
    },
    group: {
      id: 'group',
      schema: z.object({
        label: z.string(),
      }),
    },
    categorization: {
      id: 'categorization',
      schema: z.undefined(),
    },
    category: {
      id: 'category',
      schema: z.object({
        label: z.string(),
      }),
    },
  },
} as const satisfies UIExtension
