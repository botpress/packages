import 'dotenv/config'
import yargs from '@bpinternal/yargs-extra'
import * as config from './config'
import { generate } from './generate'

const onError = (thrown: unknown): never => {
  const err: Error = thrown instanceof Error ? thrown : new Error(String(thrown))
  console.error(err)
  process.exit(1)
}

const yargsFail = (msg: string, err?: Error) => (err ? onError(err) : onError(msg))

process.on('unhandledRejection', onError)
process.on('uncaughtException', onError)

void yargs
  .scriptName('genenv')
  .command(
    ['gen', '$0'],
    'Generate TypeScript file',
    () => yargs.options(config.genCmd),
    (argv) => {
      void generate(argv)
    }
  )
  .strict()
  .help()
  .fail(yargsFail)
  .demandCommand(1)
  .parse()
