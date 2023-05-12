import yargs from 'yargs'
import yn from 'yn'

const parseSingleValue = <O extends yargs.Options>(
  yargSchema: O,
  envVarValue: string
): yargs.InferredOptionType<O> | undefined => {
  if (yargSchema.type === 'string') {
    const parsed: string = envVarValue
    return parsed as yargs.InferredOptionType<O>
  }

  if (yargSchema.type === 'number') {
    const parsed: number = parseFloat(envVarValue)
    if (isNaN(parsed)) {
      return
    }
    return parsed as yargs.InferredOptionType<O>
  }

  if (yargSchema.type === 'boolean') {
    const parsed: boolean = !!yn(envVarValue)
    return parsed as yargs.InferredOptionType<O>
  }

  if (yargSchema.choices?.includes(envVarValue)) {
    const parsed: string = envVarValue
    return parsed as yargs.InferredOptionType<O>
  }
}

export const parseValue = <O extends yargs.Options>(
  yargSchema: O,
  envVarValue: string
): yargs.InferredOptionType<O> | undefined => {
  if (yargSchema.array) {
    const parts = envVarValue.split(' ')
    const parsed = parts
      .map((part) => parseSingleValue(yargSchema, part))
      .filter(<T>(v: T | undefined): v is T => v !== undefined)
    return parsed as yargs.InferredOptionType<O>
  }
  return parseSingleValue(yargSchema, envVarValue)
}
