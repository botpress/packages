import yargs from 'yargs'

type YargsOptionType = Exclude<yargs.Options['type'], 'count'>
type YargsOption = yargs.Options & { type?: YargsOptionType }

export type YargsSchema = Record<string, YargsOption>
export type YargsConfig<T extends YargsSchema> = yargs.InferredOptionTypes<T>
export type YargsArgv<T extends YargsSchema> = yargs.Arguments<yargs.InferredOptionTypes<T>>

export const asYargs = <T extends YargsSchema>(x: T): T => {
  return x
}
