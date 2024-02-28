import { Logger } from '@bpinternal/log4bot'
import yargs, { YargsArgv, YargsSchema } from '@bpinternal/yargs-extra'
import * as browser from './browser'
import * as nodejs from './nodejs'
import { sleep } from './utils'

const tests = [
  {
    name: 'nodejs-success',
    port: 9080,
    test: nodejs.testSuccess
  },
  {
    name: 'browser',
    port: 9081,
    test: browser.test
  },
  {
    name: 'nodejs-invalid-request',
    port: 9082,
    test: nodejs.testInvalidRequest
  }
]

const timeout = (ms: number) =>
  sleep(ms).then(() => {
    throw new Error(`Timeout after ${ms}ms`)
  })

const TIMEOUT = 10000

const configSchema = {
  timeout: {
    type: 'number',
    default: TIMEOUT
  },
  verbose: {
    type: 'boolean',
    default: false,
    alias: 'v'
  },
  filter: {
    type: 'string'
  }
} satisfies YargsSchema

const main = async (argv: YargsArgv<typeof configSchema>): Promise<never> => {
  const logger = new Logger('e2e', { level: argv.verbose ? 'debug' : 'info' })

  const filterRegex = argv.filter ? new RegExp(argv.filter) : null
  const filteredTests = tests.filter(({ name }) => (filterRegex ? filterRegex.test(name) : true))
  logger.info(`Running ${filteredTests.length} / ${tests.length} tests`)

  for (const { name, port, test } of filteredTests) {
    const logLine = `### Running test: "${name}" ###`
    const logPad = '#'.repeat(logLine.length)

    logger.info(logPad)
    logger.info(logLine)
    logger.info(`${logPad}\n`)

    try {
      await Promise.race([test(port, logger), timeout(argv.timeout)])
      logger.info(`SUCCESS: "${name}"`)
    } catch (thrown) {
      const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
      logger.attachError(err).error(`FAILURE: "${name}"`)
      process.exit(1)
    }
  }

  logger.info('All tests passed')
  process.exit(0)
}

void yargs.command('$0', 'Run E2E Tests', configSchema, main).parse()
