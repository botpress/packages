import z, { ZodTypeAny } from '../../z'

export type EvalZuiStringResult =
  | {
      success: true
      value: ZodTypeAny
    }
  | {
      success: false
      error: string
    }

export const evalZuiString = (zuiString: string): EvalZuiStringResult => {
  let result: any

  try {
    result = new Function('z', `return ${zuiString}`)(z)
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { success: false, error: `Failed to evaluate schema: ${err.message}` }
  }

  if (!(result instanceof z.ZodType)) {
    return { success: false, error: `String "${zuiString}" does not evaluate to a Zod schema` }
  }

  return {
    success: true,
    value: result,
  }
}
