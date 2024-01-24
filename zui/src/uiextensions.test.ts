import { z } from 'zod'
import { createComponent } from './uiextensions'
import { extendZod } from './zui'
import { describe, test } from 'vitest'

const testExtensions = {
  string: [
    createComponent(
      'SuperInput',
      z.object({
        allowVariables: z.boolean().optional(),
      }),
    ),
    createComponent(
      'SuperPasswordInput',
      z.object({
        requireSpecialCharacters: z.boolean().default(false).optional(),
        requireNumbers: z.boolean().default(false).optional(),
        requireLowercase: z.boolean().default(false).optional(),
        requireUppercase: z.boolean().default(false).optional(),
        minLength: z.number().default(8).optional(),
        maxLength: z.number().optional(),
      }),
    ),
  ],
  number: [
    createComponent(
      'SuperNumber',
      z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }),
    ),
  ],
  boolean: [
    createComponent(
      'SuperCheckbox',
      z.object({
        label: z.string().optional(),
      }),
    ),
  ],
  array: [
    createComponent(
      'SuperArray',
      z.object({
        minItems: z.number().optional(),
        maxItems: z.number().optional(),
      }),
    ),
  ],
  object: [
    createComponent(
      'SuperObject',
      z.object({
        label: z.string().optional(),
      }),
    ),
  ],
}

describe('ZUI UI Extensions', () => {
  test('should be able to extend zod', () => {
    const zui = extendZod<typeof testExtensions>(z)

    zui.number().displayAs({
      name: 'SuperNumber',
      min: 0,
      max: 100,
    })
  })
})
