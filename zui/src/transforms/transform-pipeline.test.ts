import { describe, it, expect } from 'vitest'
import z from '../z'
import { toJsonSchema } from './zui-to-json-schema-next'
import { fromJsonSchema } from './json-schema-to-zui-next'

const assert = (src: z.Schema) => ({
  toTransformBackToItself: () => {
    const jsonSchema = toJsonSchema(src)
    const actual = fromJsonSchema(jsonSchema)
    const expected = src
    let msg: string | undefined = undefined
    try {
      msg = `Expected ${actual.toTypescriptSchema()} to equal ${expected.toTypescriptSchema()}`
    } catch {}
    const result = actual.isEqual(expected)
    expect(result, msg).toBe(true)
  },
})

describe('transformPipeline', () => {
  it('should map ZodString to itself', async () => {
    const srcSchema = z.string()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodNumber to itself', async () => {
    const srcSchema = z.number()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodBigInt to itself', async () => {
    const srcSchema = z.bigint()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodBoolean to itself', async () => {
    const srcSchema = z.boolean()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodDate to itself', async () => {
    const srcSchema = z.date()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodUndefined to itself', async () => {
    const srcSchema = z.undefined()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodNull to itself', async () => {
    const srcSchema = z.null()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodAny to itself', async () => {
    const srcSchema = z.any()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodUnknown to itself', async () => {
    const srcSchema = z.unknown()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodNever to itself', async () => {
    const srcSchema = z.never()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodArray to itself', async () => {
    const srcSchema = z.array(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodObject to itself', async () => {
    const srcSchema = z.object({ foo: z.string() })
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodUnion to itself', async () => {
    const srcSchema = z.union([z.string(), z.number()])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodDiscriminatedUnion to itself', async () => {
    const srcSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('foo'), foo: z.string() }),
      z.object({ type: z.literal('bar'), bar: z.number() }),
    ])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodIntersection to itself', async () => {
    const srcSchema = z.intersection(
      z.object({ type: z.literal('foo'), foo: z.string() }),
      z.object({ type: z.literal('bar'), bar: z.number() }),
    )
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodTuple to itself', async () => {
    const srcSchema = z.tuple([z.string(), z.number()])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodRecord to itself', async () => {
    const srcSchema = z.record(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodSet to itself', async () => {
    const srcSchema = z.set(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodLiteral to itself', async () => {
    const srcSchema = z.literal('foo')
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodEnum to itself', async () => {
    const srcSchema = z.enum(['foo', 'bar'])
    assert(srcSchema).toTransformBackToItself()
  })
  // TODO: enable and fix this test
  it.skip('should map ZodOptional to itself', async () => {
    const srcSchema = z.optional(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  // TODO: enable and fix this test
  it.skip('should map ZodNullable to itself', async () => {
    const srcSchema = z.nullable(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodDefault to itself', async () => {
    const srcSchema = z.default(z.string(), 'foo')
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodReadonly to itself', async () => {
    const srcSchema = z.readonly(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodRef to itself', async () => {
    const srcSchema = z.ref('foo')
    assert(srcSchema).toTransformBackToItself()
  })
})
