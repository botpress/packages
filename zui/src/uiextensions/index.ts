import { ZodType, z } from 'zod'

export const createComponent = <Name extends string, O extends z.Schema>(
  name: Name,
  options: O,
): Component<Name, z.infer<O>> => ({
  name,
  ...options,
})

type BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array'

export type UIExtension = Record<BaseType, readonly Component<string, any>[]>

export type Component<N, O> = {
  name: N
} & O

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
  : never
