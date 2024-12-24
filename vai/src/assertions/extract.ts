import { z as Z } from '@botpress/sdk'

import { Context } from '../context'
import { asyncExpect } from '../utils/asyncAssertion'
import { Input, predictJson } from '../utils/predictJson'
import { makeToMatchInlineSnapshot, toAssertion } from './extension'

export type ExtractOptions<T, S> = {
  description?: string
  examples?: { value: T; extracted: S; reason: string }[]
}

export function extract<T extends Input, S extends Z.AnyZodObject>(
  value: T,
  shape: S,
  options?: ExtractOptions<T, Z.infer<S>>
) {
  const additionalMessage = options?.description
    ? `\nIn order to extract the right information, follow these instructions:\n${options.description}\n`
    : ''
  const promise = predictJson({
    systemMessage:
      'From the given input, extract the required information into the requested format.' + additionalMessage.trim(),
    examples: options?.examples?.map(({ value, reason, extracted }) => ({
      input: value,
      output: { reason, result: extracted }
    })),
    outputSchema: shape,
    model: Context.evaluatorModel,
    input: value
  })

  return {
    ...toAssertion(promise),
    toBe: (expected: Z.infer<S>) => asyncExpect(promise, (expect) => expect.toEqual(expected)),
    toMatchObject: (expected: Partial<Z.infer<S>>) => asyncExpect(promise, (expect) => expect.toMatchObject(expected)),
    toMatchInlineSnapshot: makeToMatchInlineSnapshot(promise)
  }
}
