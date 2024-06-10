import { describe, test } from 'vitest'
import { z } from './z/index'

const foo = z.ref('foo')
const bar = z.ref('bar')
const baz = z.ref('baz')

const deref = {
  foo: z.string(),
  bar: z.number(),
  baz: z.boolean(),
}

describe('unref', () => {
  test('array', () => {
    const refSchema = z.array(bar)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse([1, 2, 3])
    expect(result.success).toBe(true)
  })
  test('discriminatedUnion', () => {
    const refSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('foo'), foo: foo }),
      z.object({ type: z.literal('bar'), bar: bar }),
      z.object({ type: z.literal('baz'), baz: baz }),
    ])
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse({ type: 'foo', foo: 'astring' })
    expect(result.success).toBe(true)
  })
  test('function', () => {
    const refSchema = z.function(z.tuple([foo, bar], baz))
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse((_a: string, _b: number) => true)
    expect(result.success).toBe(true)
  })
  test('intersection', () => {
    const refSchema = z.intersection(z.object({ foo }), z.object({ bar }), z.object({ baz }))
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse({ foo: 'astring', bar: 1, baz: true })
    expect(result.success).toBe(true)
  })
  test('map', () => {
    const refSchema = z.map(foo, bar)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse(new Map([['astring', 1]]))
    expect(result.success).toBe(true)
  })
  test('nullable', () => {
    const refSchema = z.nullable(foo)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse(null)
    expect(result.success).toBe(true)
  })
  test('object', () => {
    const refSchema = z.object({
      foo,
      bar,
      baz,
    })
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse({ foo: 'astring', bar: 1, baz: true })
    expect(result.success).toBe(true)
  })
  test('optional', () => {
    const refSchema = z.optional(foo)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })
  test('promise', () => {
    const refSchema = z.promise(foo)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse(Promise.resolve('astring'))
    expect(result.success).toBe(true)
  })
  test('record', () => {
    const refSchema = z.record(foo, bar)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse({ foo: 1 })
    expect(result.success).toBe(true)
  })
  test('set', () => {
    const refSchema = z.set(foo)
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse(new Set(['astring']))
    expect(result.success).toBe(true)
  })
  test('transformer', () => {
    const refSchema = z.transformer(foo, {
      type: 'transform',
      transform: (data) => data,
    })
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse('astring')
    expect(result.success).toBe(true)
  })
  test('tuple', () => {
    const refSchema = z.tuple([foo, bar])
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse(['astring', 1])
    expect(result.success).toBe(true)
  })
  test('union', () => {
    const refSchema = z.union([foo, bar, baz])
    const derefSchema = refSchema.unreference(deref)
    const result = derefSchema.safeParse('astring')
    expect(result.success).toBe(true)
  })
})
