import { JSONSchema7, JSONSchema7Definition, JSONSchema7Type } from 'json-schema'
import * as utils from '../utils'
import * as types from './typings'
import * as errors from '../errors'
import _ from 'lodash'

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

const _toInternalRep = (schema: JSONSchema7Definition): types.JexIR => {
  if (schema === true) {
    return { type: 'unknown' }
  }

  if (schema === false) {
    return { type: 'undefined' }
  }

  if (schema.oneOf !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ oneOf: schema.oneOf })
  }

  if (schema.$ref !== undefined) {
    throw new errors.JexUnresolvedReferenceError()
  }

  if (schema.additionalItems !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ additionalItems: schema.additionalItems })
  }

  if (schema.patternProperties !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ patternProperties: schema.patternProperties })
  }

  if (schema.propertyNames !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ propertyNames: schema.propertyNames })
  }

  if (schema.if !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ if: schema.if })
  }

  if (schema.then !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ then: schema.then })
  }

  if (schema.else !== undefined) {
    throw new errors.JexUnsuportedJsonSchemaError({ else: schema.else })
  }

  if (schema.not !== undefined) {
    const not = _toInternalRep(schema.not)
    if (not.type === 'unknown') {
      return {
        type: 'undefined'
      }
    }

    if (not.type === 'undefined') {
      return {
        type: 'unknown'
      }
    }

    throw new errors.JexUnsuportedJsonSchemaError({ not: schema.not })
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
      return {
        type: 'tuple',
        items: schema.items.map(_toInternalRep)
      }
    }

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
      return {
        type: 'map',
        items: _toInternalRep(schema.additionalProperties)
      }
    }

    if (schema.properties !== undefined) {
      const properties: Record<string, types.JexIR> = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        const mapped: types.JexIR = _toInternalRep(value)
        const isRequired = schema.required?.includes(key)
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
    return {
      type: 'union',
      anyOf: schema.anyOf.map(_toInternalRep)
    }
  }

  if (schema.allOf !== undefined) {
    return {
      type: 'intersection',
      allOf: schema.allOf.map(_toInternalRep)
    }
  }

  type _expectUndefined = utils.types.Expect<utils.types.Equals<typeof schema.type, undefined>>
  return { type: 'unknown' }
}

export const fromJsonSchema = (schema: JSONSchema7): types.JexIR => {
  const jexirSchema = _toInternalRep(schema)
  return jexirSchema
}
