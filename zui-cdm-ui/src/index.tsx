import React from 'react'
import { zui, ZuiForm, type UIExtension, type ZUIReactComponent, type ZUIReactComponentLibrary } from '@bpinternal/zui'
import { z } from 'zod'

const myExtensions = {
  string: {
    myStringInput: {
      id: 'myStringInput',
      schema: z.object({ allowVariables: z.boolean().optional() })
    },
    myPasswordInput: {
      id: 'myPasswordInput',
      schema: z.object({
        requireSpecialCharacters: z.boolean().default(false).optional(),
        requireNumbers: z.boolean().default(false).optional(),
        requireLowercase: z.boolean().default(false).optional(),
        requireUppercase: z.boolean().default(false).optional(),
        minLength: z.number().default(8).optional(),
        maxLength: z.number().optional()
      })
    }
  },
  number: {
    myNumber: {
      id: 'myNumber',
      schema: z.object({ min: z.number().optional(), max: z.number().optional() })
    }
  },
  boolean: {
    myCheckbox: {
      id: 'myCheckbox',
      schema: z.object({ label: z.string().optional() })
    }
  },
  array: {
    myArray: {
      id: 'myArray',
      schema: z.object({ minItems: z.number().optional(), maxItems: z.number().optional() })
    }
  },
  object: {
    myObject: {
      id: 'myObject',
      schema: z.object({ label: z.string().optional() })
    }
  }
} as const satisfies UIExtension

declare module '@bpinternal/zui' {
  interface UIExtensionDefinition {
    extensions: typeof myExtensions
  }
}

zui.string().displayAs('myStringInput', {
  allowVariables: true
})

const MyPasswordInput: ZUIReactComponent<'string', 'myPasswordInput'> = ({ params }) => null

const components: ZUIReactComponentLibrary = {
  string: {
    myStringInput: ({ params }) => null,
    myPasswordInput: MyPasswordInput
  },
  number: {
    myNumber: ({ params }) => null
  },
  boolean: {
    myCheckbox: ({ params }) => null
  },
  array: {
    myArray: ({ params }) => null
  },
  object: {
    myObject: ({ params }) => null
  }
}

const exampleSchema = zui.object({
  name: zui.string().displayAs('myStringInput', { allowVariables: true }),
  password: zui.string().displayAs('myPasswordInput', { requireSpecialCharacters: true }),
  age: zui.number().displayAs('myNumber', { min: 0, max: 100 }),
  isHuman: zui.boolean().displayAs('myCheckbox', { label: 'Are you human?' }),
  favoriteFoods: zui.array(z.string()).displayAs('myArray', { minItems: 1, maxItems: 5 })
})

const Usage = () => {
  return (
    <>
      <h1>Look maa, a form!</h1>
      <ZuiForm components={components} schema={exampleSchema.toJsonSchema()} />
    </>
  )
}
