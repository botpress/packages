import { JSONSchema7 } from 'json-schema'
import { test, expect } from 'vitest'
import { JexIR } from './typings'
import { fromJsonSchema } from './from-json-schema'
import { jsonSchemaBuilder as $ } from '../builders'
import { normalize } from './normalize'
import { JexInvalidJsonSchemaError } from '../errors'
import { PropertyPath } from '../property-path'

const getError = (fn: () => void): Error | undefined => {
  try {
    fn()
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    return err
  }
  return
}

const expectJsonSchema = (jsonSchema: JSONSchema7) => ({
  toEqualJex: (expectedJexSchema: JexIR): void => {
    const actualJexSchema = fromJsonSchema(jsonSchema)
    const normalizedActual = normalize(actualJexSchema)
    const normalizedExpected = normalize(expectedJexSchema)
    expect(normalizedActual).toEqual(normalizedExpected)
  },
  toFailAt: (path: PropertyPath) => {
    const err = getError(() => fromJsonSchema(jsonSchema))
    expect(err, `Expected an error to be thrown`).toBeDefined()
    expect(err).toBeInstanceOf(JexInvalidJsonSchemaError)
    expect((err as JexInvalidJsonSchemaError).path).toEqual(path)
  }
})

test('JexIR should should throw an error when the JSON schema is unsuported', () => {
  const foo = (schema: JSONSchema7) => $.object({ foo: schema })
  const path: PropertyPath = [
    { type: 'key', value: 'properties' },
    { type: 'string-index', value: 'foo' }
  ]
  expectJsonSchema(foo({ not: { type: 'number' } })).toFailAt(path)
  expectJsonSchema(foo({ oneOf: [] })).toFailAt(path)
  expectJsonSchema(foo({ patternProperties: {} })).toFailAt(path)
  expectJsonSchema(foo({ propertyNames: {} })).toFailAt(path)
  expectJsonSchema(foo({ if: {} })).toFailAt(path)
  expectJsonSchema(foo({ then: {} })).toFailAt(path)
  expectJsonSchema(foo({ else: {} })).toFailAt(path)
})

test('JexIR should should throw an error when schema contains unresolved references', () => {
  const path: PropertyPath = [
    { type: 'key', value: 'items' },
    { type: 'number-index', value: 2 }
  ]
  expectJsonSchema({ type: 'array', items: [{}, {}, { $ref: '#/definitions/foo' }] }).toFailAt(path)
})

test('JexIR should model primitive types', () => {
  expectJsonSchema($.string()).toEqualJex({ type: 'string' })
  expectJsonSchema($.number()).toEqualJex({ type: 'number' })
  expectJsonSchema($.integer()).toEqualJex({ type: 'number' })
  expectJsonSchema($.boolean()).toEqualJex({ type: 'boolean' })
  expectJsonSchema($.null()).toEqualJex({ type: 'null' })
  expectJsonSchema($.undefined()).toEqualJex({ type: 'undefined' })
})

test('JexIR should model literal types', () => {
  expectJsonSchema($.literal('a')).toEqualJex({ type: 'string', value: 'a' })
  expectJsonSchema($.literal(1)).toEqualJex({ type: 'number', value: 1 })
  expectJsonSchema($.literal(true)).toEqualJex({ type: 'boolean', value: true })
})

test('JexIR should model union of primitives', () => {
  expectJsonSchema($.union([$.string(), $.number()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
  expectJsonSchema($.union([$.boolean(), $.null()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'boolean' }, { type: 'null' }]
  })
  expectJsonSchema($.union([$.string(), $.null(), $.undefined()])).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'undefined' }]
  })
})

test('JexIR should model union of literals of a single primitive', () => {
  expectJsonSchema($.union([$.literal('a'), $.literal('b')])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'string', value: 'b' }
    ]
  })
  expectJsonSchema($.union([$.literal(1), $.literal(2)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'number', value: 1 },
      { type: 'number', value: 2 }
    ]
  })
  expectJsonSchema($.union([$.literal(true), $.literal(false)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'boolean', value: true },
      { type: 'boolean', value: false }
    ]
  })
})

test('JexIR should model optional and nullable fields', () => {
  expectJsonSchema($.optional($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'undefined' }]
  })
  expectJsonSchema($.nullable($.string())).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'null' }]
  })
  expectJsonSchema($.nullable($.optional($.string()))).toEqualJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'undefined' }, { type: 'null' }]
  })
})

test('JexIR should model union of literals of multiple primitives', () => {
  expectJsonSchema($.union([$.literal('a'), $.literal(1)])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'a' },
      { type: 'number', value: 1 }
    ]
  })
  expectJsonSchema($.union([$.literal('yes'), $.literal('no'), $.literal(1), $.literal(0), $.boolean()])).toEqualJex({
    type: 'union',
    anyOf: [
      { type: 'string', value: 'yes' },
      { type: 'string', value: 'no' },
      { type: 'number', value: 1 },
      { type: 'number', value: 0 },
      { type: 'boolean' }
    ]
  })
})

test('JexIR should model empty object type as a map of unknown', () => {
  expectJsonSchema({ type: 'object' }).toEqualJex({
    type: 'map',
    items: { type: 'unknown' }
  })
})

test('JexIR should model object types', () => {
  expectJsonSchema(
    $.object({
      name: $.string(),
      age: $.number()
    })
  ).toEqualJex({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  })
})

test('JexIR should model empty array type as an array of unknown', () => {
  expectJsonSchema({ type: 'array' }).toEqualJex({
    type: 'array',
    items: { type: 'unknown' }
  })
})

test('JexIR should model array types', () => {
  expectJsonSchema($.array($.string())).toEqualJex({
    type: 'array',
    items: { type: 'string' }
  })
})

test('JexIR should model map types', () => {
  expectJsonSchema($.record($.string())).toEqualJex({
    type: 'map',
    items: { type: 'string' }
  })
})

test('JexIR should model a object type with both properties and additionalProperties', () => {
  expectJsonSchema({
    type: 'object',
    properties: {
      name: $.string(),
      age: $.number(),
      email: $.string()
    },
    required: ['name', 'age'],
    additionalProperties: $.string()
  }).toEqualJex({
    type: 'intersection',
    allOf: [
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          email: { type: 'union', anyOf: [{ type: 'string' }, { type: 'undefined' }] }
        }
      },
      { type: 'map', items: { type: 'string' } }
    ]
  })
})

test('JexIR should not treat additionalProperties false as an intersection with a record', () => {
  // { name: string; age: number } ⊈ { name: string; age: number } & Record<string, never>
  expectJsonSchema({
    type: 'object',
    properties: {
      name: $.string(),
      age: $.number()
    },
    required: ['name', 'age'],
    additionalProperties: false
  }).toEqualJex({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  })
})

test('JexIR should model unknown type', () => {
  expectJsonSchema($.unknown()).toEqualJex({ type: 'unknown' })
})

test('JexIR should model tuple types', () => {
  expectJsonSchema($.tuple([$.string(), $.number()])).toEqualJex({
    type: 'tuple',
    items: [{ type: 'string' }, { type: 'number' }]
  })
})

test('JexIR should model intersection types', () => {
  expectJsonSchema($.intersection([$.string(), $.number()])).toEqualJex({
    type: 'intersection',
    allOf: [{ type: 'string' }, { type: 'number' }]
  })
})
