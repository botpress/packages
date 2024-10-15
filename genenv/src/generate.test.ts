import { test, expect } from 'vitest'
import fs from 'fs'
import { generate } from './generate'
import { HEADER } from './consts'

test('generate', async () => {
  process.env.MY_FOO = 'foo'
  process.env.MY_BAR = 'bar'

  const outFile = './.ignore.me.secrets.ts'
  await generate({
    outFile,
    env: ['MY_FOO', 'MY_BAR', 'MY_BAZ']
  })
  const actual = await fs.promises.readFile(outFile, 'utf8')
  const expected = [
    //
    HEADER,
    'export const MY_FOO = "foo"',
    'export const MY_BAR = "bar"',
    'export const MY_BAZ = "$MY_BAZ"'
  ].join('\n')
  expect(actual).toBe(expected)
})
