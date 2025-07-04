import yargs from '@bpinternal/yargs-extra'
import spawn from 'cross-spawn'
import retry from 'retry'
import { parseArgv } from './parse-argv'

const parsed = parseArgv(process.argv.slice(2))

void yargs(parsed.command)
  .scriptName('retry')
  .command(
    '$0',
    'Retry command',
    () =>
      yargs.options({
        attempts: {
          type: 'number',
          default: 10,
          describe: 'Maximum amount of times to retry the operation.',
          alias: 'n'
        },
        factor: {
          type: 'number',
          default: 2,
          describe: 'Exponential factor to use.',
          alias: 'f'
        },
        'min-timeout': {
          type: 'number',
          default: 1000,
          describe: 'Number of milliseconds before starting the first retry.',
          alias: 't'
        },
        'max-timeout': {
          type: 'number',
          default: Infinity,
          describe: 'Maximum number of milliseconds between two retries.',
          alias: 'm'
        },
        randomize: {
          type: 'boolean',
          default: false,
          describe: 'Randomizes the timeouts by multiplying with a factor between 1 to 2.',
          alias: 'r'
        }
      }),
    (argv) => {
      const operation = retry.operation({
        retries: argv.attempts,
        factor: argv.factor,
        minTimeout: argv['min-timeout'],
        maxTimeout: argv['max-timeout'],
        randomize: argv.randomize
      })

      operation.attempt(function () {
        if (parsed.args.length < 1) {
          console.error('No command provided to retry.')
          process.exit(1)
        }

        const ls = spawn(parsed.args[0], parsed.args.slice(1), { stdio: 'inherit' })

        function retryOrExit(err?: Error, code?: number) {
          const retrying = operation.retry(err)
          if (!retrying) {
            process.exit(code)
          }
        }

        ls.on('exit', (code, signal) => {
          const err: Error | undefined =
            code === 0 ? undefined : new Error(`Command failed with exit code ${code} and signal ${signal}`)
          retryOrExit(err, code ?? undefined)
        })

        ls.on('error', (err) => {
          retryOrExit(err)
        })
      })
    }
  )
  .help()
  .parse()
