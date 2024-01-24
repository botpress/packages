import { z } from 'zod'
import { createComponent } from './uiextensions'
import { describe, test } from 'vitest'
import { Zui, zui } from './zui'

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
    const myZui = zui as Zui<typeof testExtensions>

    myZui.string().displayAs({
      name: 'SuperInput',
      allowVariables: true,
    })
  })
})
