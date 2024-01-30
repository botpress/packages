import { z } from 'zod'
import { describe, test } from 'vitest'
import { type Zui, zui as basezui } from './zui'
import { UIExtension } from './uiextensions'
import { defaultExtensions } from './uiextensions/defaults'

const testExtensions = {
  string: {
    SuperInput: { id: 'SuperInput', schema: z.object({ allowVariables: z.boolean().optional() }) },
    SuperPasswordInput: {
      id: 'SuperPasswordInput',
      schema: z.object({
        requireSpecialCharacters: z.boolean().default(false).optional(),
        requireNumbers: z.boolean().default(false).optional(),
        requireLowercase: z.boolean().default(false).optional(),
        requireUppercase: z.boolean().default(false).optional(),
        minLength: z.number().default(8).optional(),
        maxLength: z.number().optional(),
      }),
    },
  },
  number: {
    SuperNumber: { id: 'SuperNumber', schema: z.object({ min: z.number().optional(), max: z.number().optional() }) },
  },
  boolean: {
    SuperCheckbox: { id: 'SuperCheckbox', schema: z.object({ label: z.string().optional() }) },
  },
  array: {
    SuperArray: {
      id: 'SuperArray',
      schema: z.object({ minItems: z.number().optional(), maxItems: z.number().optional() }),
    },
  },
  object: {
    SuperObject: { id: 'SuperObject', schema: z.object({ label: z.string().optional() }) },
  },
} satisfies UIExtension

describe('ZUI UI Extensions', () => {
  test('should be able to extend zui using module declaration', () => {
    const zui = basezui as Zui<typeof testExtensions>
    zui.string().displayAs('SuperInput', {
      allowVariables: true,
    })

    zui.number().displayAs('SuperNumber', {
      max: 100,
    })

    zui.boolean().displayAs('SuperCheckbox', {
      label: 'This is a checkbox',
    })

    zui.array(zui.string()).displayAs('SuperArray', {
      minItems: 1,
      maxItems: 10,
    })
  })

  test('should be able to use zui with default extensions', () => {
    const zui = basezui as Zui<typeof defaultExtensions>

    zui.string().displayAs('textbox', {
      type: 'text',
      default: 'hello',
    })

    zui.number().displayAs('numberinput', {
      type: 'number',
      default: 5,
      min: 0,
      max: 10,
    })

    zui.boolean().displayAs('checkbox', {
      default: true,
    })
  })
})
