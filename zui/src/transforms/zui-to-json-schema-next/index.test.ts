import * as errs from '../common/errors'
import z from '../../z'
import { test, expect } from 'vitest'
import { toJsonSchema } from './index'

test('should map ZodString to StringSchema', () => {
  const schema = toJsonSchema(z.string())
  expect(schema).toEqual({ type: 'string' })
})

test('should map ZodNumber to NumberSchema', () => {
  const schema = toJsonSchema(z.number())
  expect(schema).toEqual({ type: 'number' })
})

test('should not support ZodNaN', () => {
  expect(() => toJsonSchema(z.nan())).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should map ZodBigInt to BigIntSchema', () => {
  const schema = toJsonSchema(z.bigint())
  expect(schema).toEqual({ type: 'integer', 'x-zui': { def: { typeName: 'ZodBigInt' } } })
})

test('should map ZodBoolean to BooleanSchema', () => {
  const schema = toJsonSchema(z.boolean())
  expect(schema).toEqual({ type: 'boolean' })
})

test('should map ZodDate to DateSchema', () => {
  const schema = toJsonSchema(z.date())
  expect(schema).toEqual({ type: 'string', format: 'date-time' })
})

test('should map ZodUndefined to UndefinedSchema', () => {
  const schema = toJsonSchema(z.undefined())
  expect(schema).toEqual({ not: true, 'x-zui': { def: { typeName: 'ZodUndefined' } } })
})

test('should map ZodNull to NullSchema', () => {
  const schema = toJsonSchema(z.null())
  expect(schema).toEqual({ type: 'null' })
})

test('should map ZodAny to AnySchema', () => {
  const schema = toJsonSchema(z.any())
  expect(schema).toEqual({})
})

test('should map ZodUnknown to UnknownSchema', () => {
  const schema = toJsonSchema(z.unknown())
  expect(schema).toEqual({ 'x-zui': { def: { typeName: 'ZodUnknown' } } })
})

test('should map ZodNever to NeverSchema', () => {
  const schema = toJsonSchema(z.never())
  expect(schema).toEqual({ not: true })
})

test('should not support ZodVoid', () => {
  expect(() => toJsonSchema(z.void())).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should map ZodArray to ArraySchema', () => {
  const schema = toJsonSchema(z.array(z.string()))
  expect(schema).toEqual({ type: 'array', items: { type: 'string' } })
})

test('should map ZodObject to ObjectSchema', () => {
  const schema = toJsonSchema(z.object({ name: z.string() }))
  expect(schema).toEqual({
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  })
})

// TODO: add more object tests for optional keys

test('should map ZodUnion to UnionSchema', () => {
  const schema = toJsonSchema(z.union([z.string(), z.number()]))
  expect(schema).toEqual({
    anyOf: [{ type: 'string' }, { type: 'number' }],
  })
})

test('should map ZodDiscriminatedUnion to DiscriminatedUnionSchema', () => {
  const schema = toJsonSchema(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('A'), a: z.string() }),
      z.object({ type: z.literal('B'), b: z.number() }),
    ]),
  )
  expect(schema).toEqual({
    anyOf: [
      {
        type: 'object',
        properties: { type: { type: 'string', const: 'A' }, a: { type: 'string' } },
        required: ['type', 'a'],
      },
      {
        type: 'object',
        properties: { type: { type: 'string', const: 'B' }, b: { type: 'number' } },
        required: ['type', 'b'],
      },
    ],
    'x-zui': {
      def: {
        typeName: 'ZodDiscriminatedUnion',
        discriminator: 'type',
      },
    },
  })
})

test('should map ZodIntersection to IntersectionSchema', () => {
  const schema = toJsonSchema(z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() })))
  expect(schema).toEqual({
    allOf: [
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        required: ['a'],
      },
      {
        type: 'object',
        properties: { b: { type: 'number' } },
        required: ['b'],
      },
    ],
  })
})

test('should map ZodTuple to TupleSchema', () => {
  const schema = toJsonSchema(z.tuple([z.string(), z.number()]))
  expect(schema).toEqual({
    type: 'array',
    items: [{ type: 'string' }, { type: 'number' }],
  })
})

test('should map ZodRecord to RecordSchema', () => {
  const schema = toJsonSchema(z.record(z.number()))
  expect(schema).toEqual({
    type: 'object',
    additionalProperties: { type: 'number' },
  })
})

test('should not support ZodMap', () => {
  expect(() => toJsonSchema(z.map(z.string(), z.number()))).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should map ZodSet to SetSchema', () => {
  const schema = toJsonSchema(z.set(z.string()))
  expect(schema).toEqual({
    type: 'array',
    items: { type: 'string' },
    uniqueItems: true,
  })
})

test('should not support ZodFunction', () => {
  expect(() => toJsonSchema(z.function())).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should not support ZodLazy', () => {
  expect(() => toJsonSchema(z.lazy(() => z.string()))).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should map ZodLiteral to LiteralSchema', () => {
  const stringSchema = toJsonSchema(z.literal('a'))
  expect(stringSchema).toEqual({ type: 'string', const: 'a' })

  const numberSchema = toJsonSchema(z.literal(1))
  expect(numberSchema).toEqual({ type: 'number', const: 1 })

  const booleanSchema = toJsonSchema(z.literal(true))
  expect(booleanSchema).toEqual({ type: 'boolean', const: true })

  const bigintSchema = toJsonSchema(z.literal(BigInt(1)))
  expect(bigintSchema).toEqual({ type: 'integer', const: 1 })

  const nullSchema = toJsonSchema(z.literal(null))
  expect(nullSchema).toEqual({ type: 'null' })

  const undefinedSchema = toJsonSchema(z.literal(undefined))
  expect(undefinedSchema).toEqual({ not: true, 'x-zui': { def: { typeName: 'ZodUndefined' } } })
})

test('should map ZodEnum to EnumSchema', () => {
  const schema = toJsonSchema(z.enum(['a', 'b']))
  expect(schema).toEqual({
    type: 'string',
    enum: ['a', 'b'],
  })
})

test('should not support ZodEffects', () => {
  expect(() => toJsonSchema(z.string().refine((s) => s === s.toUpperCase()))).toThrowError(
    errs.UnsupportedZuiToJsonSchemaError,
  )
  expect(() => toJsonSchema(z.string().transform((s) => s.toUpperCase()))).toThrowError(
    errs.UnsupportedZuiToJsonSchemaError,
  )
})

test('should not support ZodNativeEnum', () => {
  enum Fruit {
    Apple = 'apple',
    Banana = 'banana',
  }
  expect(() => toJsonSchema(z.nativeEnum(Fruit))).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should map ZodOptional to OptionalSchema', () => {
  const schema = toJsonSchema(z.string().optional())
  expect(schema).toEqual({
    anyOf: [{ type: 'string' }, { not: true, 'x-zui': { def: { typeName: 'ZodUndefined' } } }],
  })
})

test('should map ZodNullable to NullableSchema', () => {
  const schema = toJsonSchema(z.string().nullable())
  expect(schema).toEqual({
    anyOf: [{ type: 'string' }, { type: 'null' }],
  })
})

test('should map ZodDefault to ZuiJsonSchema with default anotation', () => {
  const schema = toJsonSchema(z.string().default('hello'))
  expect(schema).toEqual({
    type: 'string',
    default: 'hello',
  })
})

test('should not support ZodCatch', () => {
  expect(() => toJsonSchema(z.string().catch('apple'))).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should not support ZodPromise', () => {
  expect(() => toJsonSchema(z.string().promise())).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should not support ZodBranded', () => {
  expect(() => toJsonSchema(z.string().brand('apple'))).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should not support ZodPipeline', () => {
  expect(() => toJsonSchema(z.string().pipe(z.string()))).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should not support ZodSymbol', () => {
  expect(() => toJsonSchema(z.symbol())).toThrowError(errs.UnsupportedZuiToJsonSchemaError)
})

test('should map ZodReadonly to ZuiJsonSchema with readOnly anotation', () => {
  const schema = toJsonSchema(z.string().readonly())
  expect(schema).toEqual({
    type: 'string',
    readOnly: true,
  })
})

test('should map ZodRef to RefSchema', () => {
  const schema = toJsonSchema(z.ref('foo'))
  expect(schema).toEqual({ $ref: 'foo' })
})
