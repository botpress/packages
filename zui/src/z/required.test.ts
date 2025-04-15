import { describe, test, expect } from 'vitest'
import { z } from './index'

const expectZui = (actual: z.Schema) => ({
  not: {
    toEqual: (expected: z.Schema) => {
      const result = actual.isEqual(expected)
      let msg: string | undefined = undefined
      try {
        msg = `Expected ${actual.toTypescriptSchema()} not to equal ${expected.toTypescriptSchema()}`
      } catch {}
      expect(result, msg).toBe(true)
    },
  },
  toEqual: (expected: z.Schema) => {
    const result = actual.isEqual(expected)
    let msg: string | undefined = undefined
    try {
      msg = `Expected ${actual.toTypescriptSchema()} to equal ${expected.toTypescriptSchema()}`
    } catch {}
    expect(result, msg).toBe(true)
  },
})

describe('required', () => {
  test('undefined', () => {
    const schema = z.undefined()
    const requiredSchema = schema.required()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.never())
  })
  test('optional string', () => {
    const schema = z.string().optional()
    const requiredSchema = schema.required()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string())
  })
  test('string or undefined', () => {
    const schema = z.string().or(z.undefined())
    const requiredSchema = schema.required()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string())
  })
  test('string or number or undefined', () => {
    const schema = z.union([z.string(), z.number(), z.undefined()])
    const requiredSchema = schema.required()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.union([z.string(), z.number()]))
  })
  test('empty union', () => {
    const options: any[] = []
    const schema = z.union(options as [any, any]) // should not be allowed
    const requiredSchema = schema.required()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.never())
  })
  test('readonly optional string', () => {
    const schema = z.string().optional().readonly()
    const requiredSchema = schema.required()
    expect(requiredSchema.isOptional()).toBe(false)
    expectZui(requiredSchema).toEqual(z.string().readonly())
  })
})
