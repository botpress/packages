import { ZodSchema, ZodType, z } from 'zod'

export type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export type UIExtension = {
  [type in BaseType]: {
    [id: string | number | symbol]: {
      id: string
      schema: ZodSchema
    }
  }
}

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
