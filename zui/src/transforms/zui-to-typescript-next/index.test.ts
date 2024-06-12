import { describe, it, expect } from 'vitest'
import { getTypings } from '.'
import z from '../../z'

expect.extend({
  toMatchWithoutFormatting(received: string, expected: string, _) {
    const { isNot } = this
    const transformedReceived = received.replace(/\s+/g, '')
    const transformedExpected = expected.replace(/\s+/g, '')

    return {
      pass: transformedExpected === transformedReceived,
      message: () => {
        const message = isNot ? 'not ' : ''
        const diffView = this.utils.diff(transformedExpected, transformedReceived, { expand: true })
        return `Expected output to ${message}match without formatting:\n${diffView}`
      }
    }
  }
})

describe('functions', () => {
  it('title mandatory to declare', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .describe('Add two numbers together.\nThis is a multiline description')

    expect(getTypings(fn, { declaration: true })).toThrow(/title/i)
  })

  it('function with multi-line description', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .title('add')
      .describe('Add two numbers together.\nThis is a multiline description')

    const typings =  getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      /**
       * Add two numbers together.
       * This is a multiline description
       */
      declare function add(arg0: { a: number; b: number }): number;
    `)
  })

  it('function with no args and unknown return', async () => {
    const fn = z.function().title('fn')

    const typings = getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function fn(): unknown;')
  })

  it('function with no args and void return', async () => {
    const fn = z.function().title('fn').returns(z.void())

    const typings =  getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function fn(): void;')
  })

  it('async function returning union', async () => {
    const fn = z
      .function()
      .title('fn')
      .returns(z.promise(z.union([z.number(), z.string()])))

    const typings = getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function fn(): Promise<number | string>;')
  })

  it('function with multiple args', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(
        // Arg 1
        z.object({ a: z.number().optional(), b: z.string().title('B').describe('This is B parameter') }),
        // Arg 2
        z.number().describe('This is a number'),
        // Arg 3
        z.tuple([z.string(), z.number().describe('This is a number')])
      )

    const typings =  getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        arg0: {
          a?: number;
          /** This is B parameter */
          b: string
        },
        /** This is a number */
        arg1: number,
        arg2: [string, /** This is a number */ number]
      ): unknown;
    `)
  })

  it('function with optional args', async () => {
    const fn = z.function().title('fn').args(z.string().optional())
    const typings =  getTypings(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting('declare function fn(arg0?: string): unknown;')
  })

  it('string literals', async () => {
    const typings =  getTypings(
      z.union([z.literal('Hello, world!'), z.literal('Yoyoyoyo')]).describe('yoyoyo\nmultiline')
    )
    expect(typings).toMatchWithoutFormatting(`
      /**
       * yoyoyo
       * multiline
       */
      'Hello, world!' | 'Yoyoyoyo'
    `)
  })

  it('function with named args', async () => {
    const fn = z.function().title('fn').args(z.string().title('firstName').optional())
    const typings =  getTypings(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting('declare function fn(firstName?: string): unknown;')
  })

  it('mix of named and unnammed params', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj'))
    const typings =  getTypings(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        firstName?: string,
        arg1: number,
        obj: { a: string }
      ): unknown;
    `)
  })

  it('nullables and optionals combined', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().nullable().optional(), z.number().optional())
      .returns(z.string().nullable().optional())

    const typings =  getTypings(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        arg0?: string | null,
        arg1?: number
      ): string | null | undefined;
    `)
  })
})

describe('objects', () => {
  it('title mandatory to declare', async () => {
    const obj = z.object({ a: z.number(), b: z.string() })
    expect(getTypings(obj, { declaration: true })).rejects.toThrow(/title/i)
  })

  it('normal object', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string };')
  })

  it('object with title and description', async () => {
    const obj = z
      .object({ a: z.number(), b: z.string() })
      .title('MyObject')
      .describe('This is my object.\nThis is a multiline description.\n\n\n')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      /**
       * This is my object.
       * This is a multiline description.
       */
      declare const MyObject: { a: number; b: string };
    `)
  })

  it('nullable', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').nullable()

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string } | null;')
  })

  it('optionals with default values', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').optional().default({ a: 1, b: 'hello' })

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string } | undefined;')
  })

  it('enum', async () => {
    const obj = z.object({ a: z.enum(['hello', 'world']) }).title('MyObject')

    const typings =  getTypings(obj)

    expect(typings).toMatchWithoutFormatting(`
      {
        a: 'hello' | 'world'
      }
    `)
  })

  it('object with a description & optional', async () => {
    const obj = z
      .object({
        someStr: z.string().describe('Description').optional()
      })
      .title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** Description */
        someStr?: string
      };
    `)
  })

  it('object with optional and a description (opposite of previous test)', async () => {
    const obj = z
      .object({
        someStr: z.string().optional().describe('Description')
      })
      .title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** Description */
        someStr?: string
      };
    `)
  })

  it('object with nullable object and no properties', async () => {
    const obj = z
      .object({
        address: z.object({}).nullable()
      })
      .title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { address: {} | null };')
  })

  it('zod record', async () => {
    const obj = z
      .object({
        address: z
          .record(
            z.number(),
            z.object({
              street: z.string(),
              number: z.number()
            })
          )
          .describe('This is a record')
      })
      .title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** This is a record */
        address: { [key: number]: { street: string; number: number } }
      };
    `)
  })

  it('zod record with an optional object', async () => {
    const obj = z
      .object({
        computed: z.record(
          z.string(),
          z
            .object({
              status: z.string(),
              error: z.string().optional()
            })
            .optional()
        )
      })
      .title('MyObject')

    const typings = getTypings(obj, { declaration: true })

    //'?' at the end of a type is not valid TypeScript syntax. Did you mean to write '{ status: string; error?: string | undefined; } | undefined'?
    expect(typings).toMatchWithoutFormatting(
      `
      declare const MyObject: {
        computed: { [key: string]: { status: string; error?: string } | undefined }
      };
    `
    )
  })

  it('zod lazy', async () => {
    const obj = z
      .object({
        address: z.lazy(() =>
          z
            .record(
              z.number(),
              z.object({
                street: z.string(),
                number: z.number()
              })
            )
            .describe('This is a record')
        )
      })
      .title('MyObject')

    const typings = getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        address: /** This is a record */ {
          [key: number]: { street: string; number: number }
        }
      };
    `)
  })

  it('array of complex object as input params', async () => {
    const fn = z
      .function()
      .args(z.array(z.object({ a: z.number(), b: z.string() })))
      .title('MyObject')
    const typings =  getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function MyObject(arg0: Array<{ a: number; b: string }>): unknown;')
  })

  it('array of primitives as input params', async () => {
    const fn = z.function().args(z.array(z.number()).describe('This is an array of numbers')).title('MyObject')
    const typings =  getTypings(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare function MyObject(
        /** This is an array of numbers */
        arg0: number[]
      ): unknown;
    `)
  })

  it('zod effects', async () => {
    const obj = z
      .object({
        a: z
          .string()
          .title('A')
          .describe('This is A')
          .transform((val) => val.toUpperCase())
      })
      .title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** This is A */
        a: /**
         * This is A
         */
        string
      };
    `)
  })

  it('zod effects', async () => {
    const obj = z
      .object({
        'Hello World!': z.string(),
        'Hey?': z.string().optional(),
        'Hey!': z.string().optional()
      })
      .title('MyObject')

    const typings =  getTypings(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        'Hello World!': string;
        'Hey?'?: string;
        'Hey!'?: string
      };
    `)
  })
})

// TODO: regex, discriminated unions, literals, arrays, never, NaN, z.catch(), z.transform(), z.effects()
