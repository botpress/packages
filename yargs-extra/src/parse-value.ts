import yargs from 'yargs'
import yn from 'yn'

export const parseValue = <O extends yargs.Options>(
  yargSchema: O,
  envVarValue: string
): yargs.InferredOptionType<O> | undefined => {
  if (yargSchema.type === 'string') {
    const parsed: string = envVarValue
    return parsed as any // typescript is dumb
  }

  if (yargSchema.type === 'number') {
    const parsed: number = parseFloat(envVarValue)
    if (isNaN(parsed)) {
      return
    }
    return parsed as any // typescript is dumb
  }

  if (yargSchema.type === 'boolean') {
    const parsed: boolean = !!yn(envVarValue)
    return parsed as any // typescript is dumb
  }

  if (yargSchema.choices?.includes(envVarValue)) {
    const parsed: string = envVarValue
    return parsed as any // typescript is dumb
  }
}
