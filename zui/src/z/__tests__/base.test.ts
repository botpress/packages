import { test, expect } from 'vitest'
import z from '../index'
import { util } from '../types/utils'

test('type guard', () => {
  const stringToNumber = z.string().transform((arg) => arg.length)

  const s1 = z.object({
    stringToNumber,
  })
  type t1 = z.input<typeof s1>

  const data = { stringToNumber: 'asdf' }
  const parsed = s1.safeParse(data)
  if (parsed.success) {
    util.assertEqual<typeof data, t1>(true)
  }
})

test('test this binding', () => {
  const callback = (predicate: (val: string) => boolean) => {
    return predicate('hello')
  }

  expect(callback((value) => z.string().safeParse(value).success)).toBe(true) // true
  expect(callback((value) => z.string().safeParse(value).success)).toBe(true) // true
})
