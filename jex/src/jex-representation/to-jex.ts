import { JSONSchema7, JSONSchema7Type } from 'json-schema'
import * as types from './typings'
import * as err from '../errors'
import _ from 'lodash'
import { flattenUnions } from './flatten-unions'
import { dereference, JSONParserError } from '@apidevtools/json-schema-ref-parser'

const _dereference = async (schema: JSONSchema7): Promise<JSONSchema7> => {
  try {
    const unref = await dereference(schema, {
      dereference: {
        circular: false // TODO: add support for circular references
      }
    })
    return unref as JSONSchema7
  } catch (thrown) {
    if (thrown instanceof ReferenceError) {
      const mapped = new err.JexReferenceError(thrown)
      mapped.stack = thrown.stack
      throw mapped
    }
    if (thrown instanceof JSONParserError) {
      const mapped = new err.JexParserError(thrown)
      mapped.stack = thrown.stack
      throw mapped
    }
    throw thrown
  }
}

const _toInternalPrimitive = <T extends 'string' | 'number' | 'boolean'>(
  type: T,
  schema: JSONSchema7
): types.JexType => {
  if (schema.enum === undefined && schema.const === undefined) {
    return { type } as types.JexPrimitives[T]
  }
  let values: JSONSchema7Type[] = []
  if (schema.enum !== undefined) {
    values.push(...schema.enum)
  }
  if (schema.const !== undefined) {
    values.push(schema.const)
  }
  values = values.filter((value) => typeof value === type)
  if (values.length === 0) {
    return { type } as types.JexPrimitives[T]
  }
  if (values.length === 1) {
    return {
      type,
      value: values[0] as types.JexPrimitiveContents[T]
    }
  }
  return {
    type: 'union',
    anyOf: values.map((value) => ({ type, value }))
  } as types.JexUnion
}

const _toInternalRep = (schema: JSONSchema7): types.JexType => {
  if (schema.not !== undefined) {
    if (schema.not === true) {
      return {
        type: 'any'
      }
    }

    if (schema.not === false) {
      return {
        type: 'undefined'
      }
    }

    const not = _toInternalRep(schema.not)
    if (not.type === 'any') {
      return {
        type: 'undefined'
      }
    }

    throw new err.JexError('Not schema is only partially supported')
  }

  if (Array.isArray(schema.type)) {
    const { type: _, ...tmp } = schema
    return {
      type: 'union',
      anyOf: schema.type.map((type) => _toInternalRep({ type, ...tmp }))
    }
  }

  if (schema.type === 'string') {
    return _toInternalPrimitive('string', schema)
  }

  if (schema.type === 'number') {
    return _toInternalPrimitive('number', schema)
  }

  if (schema.type === 'boolean') {
    return _toInternalPrimitive('boolean', schema)
  }

  if (schema.type === 'null') {
    return { type: 'null' }
  }

  if (schema.type === 'array') {
    if (schema.items === undefined) {
      return {
        type: 'array',
        items: { type: 'any' }
      }
    }

    if (Array.isArray(schema.items)) {
      const items = schema.items.filter(<T>(i: T | boolean): i is T => typeof i !== 'boolean')
      return {
        type: 'tuple',
        items: items.map(_toInternalRep)
      }
    }

    // TODO: check for prefixItems and additionalItems

    if (typeof schema.items !== 'object') {
      throw new err.JexError('Array schema items must be an object')
    }
    return {
      type: 'array',
      items: _toInternalRep(schema.items)
    }
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties !== undefined && schema.properties === undefined) {
      if (schema.additionalProperties === true) {
        return {
          type: 'map',
          items: { type: 'any' }
        }
      }
      if (schema.additionalProperties === false) {
        return {
          type: 'object',
          properties: {}
        }
      }
      if (typeof schema.additionalProperties !== 'object') {
        throw new err.JexError('Object schema additionalProperties must be an object')
      }
      return {
        type: 'map',
        items: _toInternalRep(schema.additionalProperties)
      }
    }

    if (schema.properties === undefined) {
      return {
        type: 'object',
        properties: {}
      }
    }

    const properties: Record<string, types.JexType> = {}
    for (const [key, value] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key)
      const mapped = _toInternalRep(value as JSONSchema7)
      if (isRequired) {
        properties[key] = mapped
      } else {
        properties[key] = {
          type: 'union',
          anyOf: [mapped, { type: 'undefined' }]
        }
      }
    }
    return {
      type: 'object',
      properties
    }
  }

  if (schema.anyOf !== undefined) {
    const enums: JSONSchema7[] = []
    for (const item of schema.anyOf) {
      if (item === true || item === false) {
        throw new err.JexError('Boolean schema is not supported')
      }
      enums.push(item)
    }

    return {
      type: 'union',
      anyOf: enums.map(_toInternalRep)
    }
  }

  return { type: 'any' }
}

export const toJex = async (schema: JSONSchema7): Promise<types.JexType> => {
  const unref = await _dereference(schema)
  const jex = _toInternalRep(unref)
  return flattenUnions(jex)
}
