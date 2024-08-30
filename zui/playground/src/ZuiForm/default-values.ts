import { ArraySchema, JSONSchema, TupleSchema, TypeOf } from '../json-schema'

/**
 * Type guards do not propagate type narrowings to parent objects, see:
 * https://stackoverflow.com/questions/73199307/do-discriminated-unions-only-work-with-literal-types
 */
const isTuple = (schema: ArraySchema | TupleSchema): schema is TupleSchema => Array.isArray(schema.items)
const isOptional = (schema: JSONSchema): boolean =>
  schema.anyOf?.some((s) => s.not && Object.keys(s.not).length === 0) || false

// @ts-ignore (ts complains about a potential infinitly deep recursion)
export function getDefaultData<S extends JSONSchema>(schema: S): TypeOf<S>
export function getDefaultData<S extends JSONSchema>(schema: S, optiona: undefined | false): TypeOf<S>
export function getDefaultData<S extends JSONSchema>(schema: S, optional: true): undefined
export function getDefaultData<S extends JSONSchema>(schema: S, optional?: boolean): TypeOf<S> | undefined
export function getDefaultData<S extends JSONSchema>(schema: S, optional?: boolean): TypeOf<S> | undefined {
  if (optional) {
    return undefined
  }

  if (schema.default) {
    return schema.default
  }

  if (schema.nullable) {
    return null as TypeOf<S>
  }

  if (schema.type === 'null') {
    return null as TypeOf<S>
  }

  if (schema.type === undefined) {
    // any
    if (schema.default) {
      return schema.default
    }
    return {} as any
  }

  if (schema.type === 'object' && schema.additionalProperties) {
    // record
    return {} as TypeOf<S>
  }

  if (schema.type === 'array' && isTuple(schema)) {
    // tuple
    return schema.items.map((item) => getDefaultData(item)) as TypeOf<S>
  }

  if (schema.anyOf?.length) {
    return getDefaultData(schema.anyOf[0]!) as TypeOf<S>
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      const data: Record<string, any> = {}
      Object.entries(schema.properties).map(([key, fieldSchema]) => {
        data[key] = getDefaultData(fieldSchema, !schema.required?.includes(key) || isOptional(fieldSchema) || false)
      })
      return data as TypeOf<S>
    }
  }

  if (schema.type === 'array' && !Array.isArray(schema.items)) {
    if (schema.minItems && schema.minItems > 0) {
      return [getDefaultData(schema.items)] as TypeOf<S>
    }

    return [] as TypeOf<S>
  }

  if (schema.type === 'string') {
    if (schema.enum?.length) {
      return schema.enum[0] as TypeOf<S>
    }
    return '' as TypeOf<S>
  }

  if (schema.type === 'number') {
    if (schema.enum?.length) {
      return schema.enum[0] as TypeOf<S>
    }
    return 0 as TypeOf<S>
  }

  if (schema.type === 'boolean') {
    if (schema.enum?.length) {
      return schema.enum[0] as TypeOf<S>
    }
    return false as TypeOf<S>
  }

  return undefined as TypeOf<S>
}
