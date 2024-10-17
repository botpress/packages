import { JSONSchema7, JSONSchema7Type } from 'json-schema'
import * as types from './typings'
import * as err from '../errors'
import _ from 'lodash'
import { dereference, JSONParserError } from '@apidevtools/json-schema-ref-parser'

type _Primitives = {
  string: types.JexIRString
  number: types.JexIRNumber
  boolean: types.JexIRBoolean
}

type _Literals = {
  string: types.JexIRStringLiteral
  number: types.JexIRNumberLiteral
  boolean: types.JexIRBooleanLiteral
}

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

const _toInternalPrimitive = <T extends 'string' | 'number' | 'boolean'>(type: T, schema: JSONSchema7): types.JexIR => {
  if (schema.enum === undefined && schema.const === undefined) {
    return { type } as _Primitives[T]
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
    return { type } as _Primitives[T]
  }
  if (values.length === 1) {
    return {
      type,
      value: values[0]
    } as _Literals[T]
  }
  return {
    type: 'union',
    anyOf: values.map((value) => ({ type, value }))
  } as types.JexIRUnion
}

const _toInternalRep = (schema: JSONSchema7): types.JexIR => {
  if (schema.not !== undefined) {
    if (schema.not === true) {
      return {
        type: 'unknown'
      }
    }

    if (schema.not === false) {
      return {
        type: 'undefined'
      }
    }

    const not = _toInternalRep(schema.not)
    if (not.type === 'unknown') {
      return {
        type: 'undefined'
      }
    }

    // not is only partially supported
    return {
      type: 'unknown'
    }
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

  if (schema.type === 'number' || schema.type === 'integer') {
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
        items: { type: 'unknown' }
      }
    }

    if (Array.isArray(schema.items)) {
      const items = schema.items.filter(<T>(i: T | boolean): i is T => typeof i !== 'boolean')
      return {
        type: 'tuple',
        items: items.map(_toInternalRep)
      }
    }

    if (schema.items === true) {
      return {
        type: 'array',
        items: { type: 'unknown' }
      }
    }

    if (schema.items === false) {
      return { type: 'tuple', items: [] }
    }

    // TODO: check for prefixItems and additionalItems

    return {
      type: 'array',
      items: _toInternalRep(schema.items)
    }
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties !== undefined && schema.properties !== undefined) {
      return {
        type: 'intersection',
        allOf: [
          _toInternalRep({ ...schema, additionalProperties: undefined }),
          _toInternalRep({ ...schema, properties: undefined })
        ]
      }
    }

    if (schema.additionalProperties !== undefined) {
      if (schema.additionalProperties === true) {
        return {
          type: 'map',
          items: { type: 'unknown' }
        }
      }
      if (schema.additionalProperties === false) {
        return {
          type: 'object',
          properties: {}
        }
      }
      return {
        type: 'map',
        items: _toInternalRep(schema.additionalProperties)
      }
    }

    if (schema.properties !== undefined) {
      const properties: Record<string, types.JexIR> = {}
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

    return {
      type: 'object',
      properties: {}
    }
  }

  if (schema.anyOf !== undefined) {
    const anyOf: types.JexIR[] = []

    for (const item of schema.anyOf) {
      if (item === true || item === false) {
        anyOf.push({ type: 'unknown' })
      } else {
        anyOf.push(_toInternalRep(item))
      }
    }

    return {
      type: 'union',
      anyOf: anyOf
    }
  }

  if (schema.allOf !== undefined) {
    const allOf: types.JexIR[] = []

    for (const item of schema.allOf) {
      if (item === true || item === false) {
        allOf.push({ type: 'unknown' })
      } else {
        allOf.push(_toInternalRep(item))
      }
    }

    return {
      type: 'intersection',
      allOf: allOf
    }
  }

  return { type: 'unknown' }
}

export const fromJsonSchema = async (schema: JSONSchema7): Promise<types.JexIR> => {
  const unref = await _dereference(schema)
  const jexirSchema = _toInternalRep(unref)
  return jexirSchema
}
