import { describe, expect, test } from 'vitest'
import { z } from '../../z/index'

describe('zui-to-ts', () => {
  test('generate typings for example schema', async () => {
    const schema = z.object({
      name: z.string().title('Name'),
      age: z.number().max(100).min(0).title('Age').describe('Age in years').default(18),
      job: z.enum(['developer', 'designer', 'manager']).title('Job').default('developer'),
      group: z.union([z.literal('avg'), z.literal('key'), z.literal('max')]),
    })

    const def = await schema.toTypescriptTypings({ schemaName: 'User' })
    expect(def).toMatchInlineSnapshot(`
"export interface User {
name: string
/**
 * Age in years
 */
age?: number
job?: (\"developer\" | \"designer\" | \"manager\")
group: (\"avg\" | \"key\" | \"max\")
}
"
    `)
  })

  test('without schema, no export statement', async () => {
    const schema = z.object({
      name: z.string().title('Name'),
    })

    const def = await schema.toTypescriptTypings()
    expect(def).toMatchInlineSnapshot(`
"{
name: string
}
"
    `)
  })


  test('generate typings for example schema with nested object', async () => {
    const schema = z.object({
      name: z.string().title('Name'),
      age: z.number().max(100).min(0).title('Age').describe('Age in years').default(18),
      job: z.enum(['developer', 'designer', 'manager']).title('Job').default('developer'),
      group: z.union([z.literal('avg'), z.literal('key'), z.literal('max')]),
      address: z.object({
        city: z.string(),
        street: z.string(),
      }),
    })

    const def = await schema.toTypescriptTypings()
    console.log(def)
  })
})

// describe('functions', () => {
//   it('title mandatory to declare', async () => {
//     const fn = z
//       .function()
//       .args(z.object({ a: z.number(), b: z.number() }))
//       .returns(z.number())
//       .describe('Add two numbers together.\nThis is a multiline description')

//     fn.toTypescriptTypings()
//     expect(getTypings(fn, { declaration: true })).rejects.toThrow(/title/i)
//   })

//   it('function with multi-line description', async () => {
//     const fn = z
//       .function()
//       .args(z.object({ a: z.number(), b: z.number() }))
//       .returns(z.number())
//       .title('add')
//       .describe('Add two numbers together.\nThis is a multiline description')

//     const typings = await getTypings(fn, { declaration: true })

//     expect(typings).toMatchInlineSnapshot(`
//       "/**
//        * Add two numbers together.
//        * This is a multiline description
//        */
//       declare function add(arg0: { a: number; b: number }): number"
//     `)
//   })

//   it('function with no args and unknown return', async () => {
//     const fn = z.function().title('fn')

//     const typings = await getTypings(fn, { declaration: true })

//     expect(typings).toMatchInlineSnapshot('"declare function fn(): unknown"')
//   })

//   it('function with no args and void return', async () => {
//     const fn = z.function().title('fn').returns(z.void())

//     const typings = await getTypings(fn, { declaration: true })

//     expect(typings).toMatchInlineSnapshot('"declare function fn(): void"')
//   })

//   it('async function returning union', async () => {
//     const fn = z
//       .function()
//       .title('fn')
//       .returns(z.promise(z.union([z.number(), z.string()])))

//     const typings = await getTypings(fn, { declaration: true })

//     expect(typings).toMatchInlineSnapshot('"declare function fn(): Promise<number | string>"')
//   })

//   it('function with multiple args', async () => {
//     const fn = z
//       .function()
//       .title('fn')
//       .args(
//         // Arg 1
//         z.object({ a: z.number().optional(), b: z.string().title('B').describe('This is B parameter') }),
//         // Arg 2
//         z.number().describe('This is a number'),
//         // Arg 3
//         z.tuple([z.string(), z.number().describe('This is a number')])
//       )

//     const typings = await getTypings(fn, { declaration: true })

//     expect(typings).toMatchInlineSnapshot(`
//       "declare function fn(
//         arg0: { a?: number; /** This is B parameter */ b: string },
//         /** This is a number */ arg1: number,
//         arg2: [string, /** This is a number */ number],
//       ): unknown"
//     `)
//   })

//   it('function with optional args', async () => {
//     const fn = z.function().title('fn').args(z.string().optional())
//     const typings = await getTypings(fn, { declaration: true })
//     expect(typings).toMatchInlineSnapshot('"declare function fn(arg0?: string): unknown"')
//   })

//   it('function with named args', async () => {
//     const fn = z.function().title('fn').args(z.string().title('firstName').optional())
//     const typings = await getTypings(fn, { declaration: true })
//     expect(typings).toMatchInlineSnapshot('"declare function fn(firstName?: string): unknown"')
//   })

//   it('mix of named and unnammed params', async () => {
//     const fn = z
//       .function()
//       .title('fn')
//       .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj'))
//     const typings = await getTypings(fn, { declaration: true })
//     expect(typings).toMatchInlineSnapshot(`
//       "declare function fn(
//         firstName?: string,
//         arg1: number,
//         obj: { a: string },
//       ): unknown"
//     `)
//   })

//   it('nullables and optionals combined', async () => {
//     const fn = z
//       .function()
//       .title('fn')
//       .args(z.string().nullable().optional(), z.number().optional())
//       .returns(z.string().nullable().optional())

//     const typings = await getTypings(fn, { declaration: true })
//     expect(typings).toMatchInlineSnapshot(`
//       "declare function fn(
//         arg0?: string | null,
//         arg1?: number,
//       ): string | null | undefined"
//     `)
//   })
// })

// describe('objects', () => {
//   it('title mandatory to declare', async () => {
//     const obj = z.object({ a: z.number(), b: z.string() })
//     expect(getTypings(obj, { declaration: true })).rejects.toThrow(/title/i)
//   })

//   it('normal object', async () => {
//     const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject')

//     const typings = await getTypings(obj, { declaration: true })

//     expect(typings).toMatchInlineSnapshot('"declare const MyObject: { a: number; b: string }"')
//   })

//   it('object with title and description', async () => {
//     const obj = z
//       .object({ a: z.number(), b: z.string() })
//       .title('MyObject')
//       .describe('This is my object.\nThis is a multiline description.\n\n\n')

//     const typings = await getTypings(obj, { declaration: true })

//     expect(typings).toMatchInlineSnapshot(`
//       "/**
//        * This is my object.
//        * This is a multiline description.
//        */
//       declare const MyObject: { a: number; b: string }"
//     `)
//   })

//   it('nullable', async () => {
//     const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').nullable()

//     const typings = await getTypings(obj, { declaration: true })

//     expect(typings).toMatchInlineSnapshot('"declare const MyObject: { a: number; b: string } | null"')
//   })

//   it('optionals with default values', async () => {
//     const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').optional().default({ a: 1, b: 'hello' })

//     const typings = await getTypings(obj, { declaration: true })

//     expect(typings).toMatchInlineSnapshot('"declare const MyObject: { a: number; b: string } | undefined"')
//   })
// })