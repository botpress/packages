import { describe, expect } from 'vitest'
import { toTypescriptSchema as toTypescript } from '.'
import z from '../../z'
import { evalZuiString } from '../common/eval-zui-string'

describe('toTypescriptZuiString', () => {
  test('string', async () => {
    const expected = `z.string()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('number', async () => {
    const expected = `z.number()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('nan', async () => {
    const expected = `z.nan()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('bigint', async () => {
    const expected = `z.bigint()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('boolean', async () => {
    const expected = `z.boolean()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('date', async () => {
    const expected = `z.date()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('undefined', async () => {
    const expected = `z.undefined()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('null', async () => {
    const expected = `z.null()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('any', async () => {
    const expected = `z.any()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('unknown', async () => {
    const expected = `z.unknown()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('never', async () => {
    const expected = `z.never()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('void', async () => {
    const expected = `z.void()`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('array', async () => {
    const expected = `z.array(z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('object', async () => {
    const expected = `z.object({
      a: z.string(),
      b: z.number(),
    })`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('union', async () => {
    const expected = `z.union([z.string(), z.number(), z.boolean()])`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('discriminatedUnion', async () => {
    const expected = `z.discriminatedUnion("type", [
      z.object({ type: z.literal("A"), a: z.string() }),
      z.object({ type: z.literal("B"), b: z.number() }),
    ])`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('intersection', async () => {
    const expected = `z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('tuple', async () => {
    const expected = `z.tuple([z.string(), z.number()])`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('record', async () => {
    const expected = `z.record(z.string(), z.number())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('map', async () => {
    const expected = `z.map(z.string(), z.number())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('set', async () => {
    const expected = `z.set(z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('function with no argument', async () => {
    const expected = `z.function().returns(z.void())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('function with multiple arguments', async () => {
    const expected = `z.function().args(z.number(), z.string()).returns(z.boolean())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('lazy', async () => {
    const expected = `z.lazy(() => z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('literal string', async () => {
    const expected = `z.literal("banana")`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('literal number', async () => {
    const expected = `z.literal(42)`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('literal boolean', async () => {
    const expected = `z.literal(true)`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('enum', async () => {
    const expected = `z.enum(["banana", "apple", "orange"])`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('effects', () => {
    const schema = z.string().transform((s) => s.toUpperCase())
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError() // not supported
  })
  test('nativeEnum', async () => {
    enum Fruit {
      Banana = 'banana',
      Apple = 'apple',
      Orange = 'orange',
    }
    const schema = z.nativeEnum(Fruit)
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError() // not supported
  })
  test('optional', async () => {
    const expected = `z.optional(z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('nullable', async () => {
    const expected = `z.nullable(z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('default', async () => {
    const expected = `z.string().default('banana')` // TODO: should use `z.default(z.string(), 'banana')` for uniformity
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('catch', () => {
    const expected = `z.string().catch('banana')` // TODO: should use `z.catch(z.string(), 'banana')` for uniformity
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    expect(actual).toMatch(expected)
  })
  test('promise', async () => {
    const expected = `z.promise(z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('branded', () => {
    const schema = z.string().brand('MyString')
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError() // not supported
  })
  test('pipeline', async () => {
    const schema = z.pipeline(z.string(), z.number())
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError() // not supported
  })
  test('symbol', async () => {
    const schema = z.symbol()
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError() // not supported
  })
  test('readonly', async () => {
    const expected = `z.readonly(z.string())`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('ref', async () => {
    const expected = `z.ref("#item")`
    const schema = evalZuiString(expected)
    const actual = toTypescript(schema)
    await expect(actual).toMatchWithoutFormatting(expected)
  })
  test('templateLiteral', async () => {
    const schema = z.templateLiteral()
    const fn = () => toTypescript(schema)
    expect(fn).toThrowError() // not supported
  })
})
