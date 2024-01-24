import { ZodType, z } from 'zod'

export const createComponent = <Type extends string, O extends z.Schema>(
  type: Type,
  schema: O,
): Component<Type, z.infer<O>> => ({
  type,
  schema,
})

type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export type UIExtension = Record<BaseType, readonly Component<string, any>[]>

export type Component<Type, Schema> = {
  type: Type
  schema: Schema
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
