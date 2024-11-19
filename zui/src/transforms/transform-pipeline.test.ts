import { zodToJsonSchema } from './zui-to-json-schema'
import { jsonSchemaToZui } from './json-schema-to-zui'
import { toTypescriptSchema } from './zui-to-typescript-schema'
import { test, expect } from 'vitest'
import z from '../z'
import { evalZuiString } from './common/eval-zui-string'

/**
 * This test file contains integration tests to ensure the multiple transforms can be chained together
 */

const transformAll = (originalSchema: z.ZodType): z.ZodType => {
  const jsonSchema = zodToJsonSchema(originalSchema)
  console.log(JSON.stringify(jsonSchema))
  const zuiSchema = jsonSchemaToZui(jsonSchema)
  const typescriptSchema = toTypescriptSchema(zuiSchema)
  console.log(typescriptSchema)
  const evalResult = evalZuiString(typescriptSchema)
  if (evalResult.sucess === false) {
    throw new Error(`Failed to evaluate zui schema "${typescriptSchema}"; ${evalResult.error}`)
  }
  return evalResult.value
}

test('optional union from one end to the other and back', () => {
  const originalSchema = z.object({
    foo: z.literal('42').or(z.literal(42)).optional().nullable(),
  })
  const destinationSchema = transformAll(originalSchema)
  expect(originalSchema.isEqual(destinationSchema)).toBe(true)
})
