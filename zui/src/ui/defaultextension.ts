import { z } from 'zod'
import { UICategorySchema, UIComponentDefinitions } from './types'
import { ComponentImplementationMap } from './types'

const commonInputSchema = z.object({
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
      schema: z.object({}),
    },
    horizontalLayout: {
      id: 'horizontalLayout',
      schema: z.object({}),
    },
    group: {
      id: 'group',
      schema: z.object({
        label: z.string(),
      }),
    },
    categorization: {
      id: 'categorization',
      schema: z.object({}),
    },
    category: {
      id: 'category',
      schema: z.object({
        label: z.string(),
      }),
    },
  },
} as const satisfies UIComponentDefinitions

export const defaultExtensionComponents: ComponentImplementationMap<typeof defaultExtensions> = {
  string: {
    textbox: ({ multiline, label, fitContentWidth, readonly }, { scope }) => {
      return {
        type: 'Control',
        scope,
        label: label,
        options: {
          multi: multiline,
          readOnly: readonly,
          trim: fitContentWidth,
        },
      }
    },
    datetimeinput: ({ type, label, readonly }, { scope }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          format: type,
          readOnly: readonly,
        },
      }
    },
  },
  number: {
    numberinput: ({ readonly }, { scope }) => {
      return {
        type: 'Control',
        scope,
        options: {
          readOnly: readonly,
        },
      }
    },
    slider: ({ label, readonly }, { scope }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          slider: true,
          readOnly: readonly,
        },
      }
    },
  },
  array: {
    select: (_, __, children) => {
      return {
        type: 'VerticalLayout',
        elements: children,
      }
    },
  },
  boolean: {
    checkbox: ({ label, readonly }, { scope }) => {
      return {
        type: 'Control',
        scope,
        label,
        options: {
          readOnly: readonly,
        },
      }
    },
  },
  object: {
    verticalLayout: (_, __, children) => {
      return {
        type: 'VerticalLayout',
        elements: children,
      }
    },
    horizontalLayout: (_, __, children) => {
      return {
        type: 'HorizontalLayout',
        elements: children,
      }
    },
    category: ({ label }, __, children) => {
      return {
        type: 'Category',
        label,
        elements: children,
      }
    },
    categorization: (_, __, children) => {
      return {
        type: 'Categorization',
        elements: children as UICategorySchema[],
      }
    },
    group: ({ label }, _, children) => {
      return {
        type: 'Group',
        label,
        elements: children,
      }
    },
    default: (_, __, children) => {
      return {
        type: 'HorizontalLayout',
        elements: children,
      }
    },
  },
}
