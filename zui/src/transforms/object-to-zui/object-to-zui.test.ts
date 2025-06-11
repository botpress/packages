import { describe, expect, test } from 'vitest'
import { fromObject } from '.'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { fromJsonSchema } from '../json-schema-to-zui-next'

function asSchema(s: JSONSchema7Definition | undefined): JSONSchema7 | undefined {
  if (s === undefined) {
    return undefined
  }
  return s as JSONSchema7
}

describe('object-to-zui', () => {
  test('validate object to json', async () => {
    const schema: JSONSchema7 = fromObject(
      { name: 'Bob', age: 20, birthDate: '1988-11-29', isAdmin: true },
      { optional: true },
    ).toJsonSchema()

    if (schema.type !== 'object') {
      throw new Error('Expected object type')
    }

    expect(schema).toHaveProperty('type', 'object')
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(4)

    for (const key in schema.properties) {
      expect(schema.properties[key]).toHaveProperty('type')
    }
  })

  test('validate object to json (actual json)', async () => {
    const obj = {
      name: 'Bob',
      age: 20,
      birthDate: '1988-11-29T00:00:00.000Z',
      isAdmin: true,
      address: { street: '123 Main St', city: 'New York', state: 'NY' },
    }

    const schema = fromObject(obj, { optional: true }).toJsonSchema()
    fromJsonSchema(schema).parse(obj)

    expect(schema).toEqual({
      additionalProperties: false,
      properties: {
        address: {
          additionalProperties: false,
          properties: {
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
            street: {
              type: 'string',
            },
          },
          type: 'object',
        },
        age: {
          type: 'number',
        },
        birthDate: {
          format: 'date-time',
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$',
          type: 'string',
          'x-zui': {
            offset: false,
            precision: null,
          },
        },
        isAdmin: {
          type: 'boolean',
        },
        name: {
          type: 'string',
        },
      },
      type: 'object',
    })
  })

  test('should handle null values correctly', () => {
    const schema: JSONSchema7 = fromObject(
      {
        test: null,
        anotherValue: 'test',
      },
      { optional: true },
    ).toJsonSchema()

    if (schema.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(asSchema(schema.properties?.test)?.type).toEqual('null')
    expect(asSchema(schema.properties?.anotherValue)?.type).toBe('string')
  })

  test('should handle nested objects correctly', () => {
    const schema: JSONSchema7 = fromObject({
      user: {
        name: 'Alice',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
    }).toJsonSchema()

    const userSchema = asSchema(schema.properties?.user)
    expect(userSchema?.type).toBe('object')
    expect(asSchema(userSchema?.properties?.name)?.type).toBe('string')
    expect(asSchema(userSchema?.properties?.age)?.type).toBe('number')
    expect(asSchema(userSchema?.properties?.address)?.type).toBe('object')
  })

  test('should handle arrays correctly', () => {
    const schema: JSONSchema7 = fromObject(
      {
        tags: ['tag1', 'tag2'],
        scores: [1, 2, 3],
      },
      { optional: true },
    ).toJsonSchema()

    const tagsSchema = asSchema(schema.properties?.tags)
    const scoresSchema = asSchema(schema.properties?.scores)
    if (tagsSchema?.type !== 'array' || scoresSchema?.type !== 'array') {
      throw new Error('Expected array type')
    }
    expect(Array.isArray(tagsSchema?.items)).toBe(false)
    expect(tagsSchema?.type).toBe('array')
    expect((tagsSchema?.items as any)?.type).toBe('string')
    expect(scoresSchema?.type).toBe('array')
    expect(Array.isArray(scoresSchema?.items)).toBe(false)
    expect((scoresSchema?.items as any)?.type).toBe('number')
  })

  test('should handle empty objects correctly', () => {
    const schema: JSONSchema7 = fromObject({}).toJsonSchema()
    expect(schema).toHaveProperty('type', 'object')
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(0)
  })

  test('should handle datetime with timezone correctly', () => {
    const schema: JSONSchema7 = fromObject({
      eventTime: '2023-03-15T14:00:00+01:00',
    }).toJsonSchema()

    const eventTimeSchema = asSchema(schema.properties?.eventTime)

    if (eventTimeSchema?.type !== 'string') {
      throw new Error('Expected string type')
    }
    expect(eventTimeSchema?.format).toBe('date-time')
    expect(eventTimeSchema?.type).toBe('string')
  })

  test('empty objects are considered passtrough, other are strict', () => {
    const schema: JSONSchema7 = fromObject({ input: {}, test: { output: {} }, fixed: { value: true } }).toJsonSchema()

    const testSchema = asSchema(schema.properties?.test)
    const fixedSchema = asSchema(schema.properties?.fixed)

    if (testSchema?.type !== 'object' || fixedSchema?.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(3)
    expect(schema.properties?.input).toHaveProperty('additionalProperties', true)
    expect(testSchema).toHaveProperty('additionalProperties', false)
    expect(testSchema?.properties?.output).toHaveProperty('additionalProperties', true)
    expect(fixedSchema).toHaveProperty('additionalProperties', false)
  })

  test('when passtrough is set to true, they are all passtrough', () => {
    const schema: JSONSchema7 = fromObject(
      { input: {}, test: { output: {} }, fixed: { value: true } },
      { passtrough: true },
    ).toJsonSchema()

    const testSchema = asSchema(schema.properties?.test)
    const fixedSchema = asSchema(schema.properties?.fixed)

    if (testSchema?.type !== 'object' || fixedSchema?.type !== 'object') {
      throw new Error('Expected object type')
    }

    expect(schema.properties?.input).toHaveProperty('additionalProperties', true)
    expect(testSchema).toHaveProperty('additionalProperties', true)
    expect(testSchema?.properties?.output).toHaveProperty('additionalProperties', true)
    expect(fixedSchema).toHaveProperty('additionalProperties', true)
  })
})
