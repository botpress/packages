import { ZodSchema, ZodType, z } from 'zod'

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export const containerTypes = ['object', 'array'] as const
export type ContainerType = (typeof containerTypes)[number]

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
