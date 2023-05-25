import { listEntities } from './benchmarks/benchmark-1'
import { ListEntityModel, ListEntitySynonym, extractForListModels } from './list-engine'
import { spaceTokenizer } from './space-tokenizer'

import * as bench from './benchmarks'

type Logger = {
  debug: (...x: string[]) => void
  info: (...x: string[]) => void
  warn: (...x: string[]) => void
  error: (...x: string[]) => void
}

let DEBUG: boolean = false
let ITERATIONS: number = 1000

const logger: Logger = {
  debug: (...x) => DEBUG && console.log(...x),
  info: (...x) => console.log(...x),
  warn: (...x) => console.log(...x),
  error: (...x) => console.log(...x)
}

const chalk = {
  red: (x: string) => `\x1b[31m${x}\x1b[0m`,
  green: (x: string) => `\x1b[32m${x}\x1b[0m`,
  blue: (x: string) => `\x1b[34m${x}\x1b[0m`,
  yellow: (x: string) => `\x1b[33m${x}\x1b[0m`,
  magenta: (x: string) => `\x1b[35m${x}\x1b[0m`,
  cyan: (x: string) => `\x1b[36m${x}\x1b[0m`,
  redBright: (x: string) => `\x1b[91m${x}\x1b[0m`,
  greenBright: (x: string) => `\x1b[92m${x}\x1b[0m`,
  blueBright: (x: string) => `\x1b[94m${x}\x1b[0m`,
  yellowBright: (x: string) => `\x1b[93m${x}\x1b[0m`,
  magentaBright: (x: string) => `\x1b[95m${x}\x1b[0m`,
  cyanBright: (x: string) => `\x1b[96m${x}\x1b[0m`
}

const runExtraction = (utt: string, models: ListEntityModel[]): void => {
  logger.debug(chalk.blueBright(`\n\n${utt}`))

  const tokens = spaceTokenizer(utt)
  const output = extractForListModels(tokens, models)

  if (!DEBUG) {
    return
  }

  for (const { char_start, char_end, source, confidence } of output) {
    const mapChars = (x: string, c: string) =>
      x
        .split('')
        .map(() => c)
        .join('')

    const before = mapChars(utt.slice(0, char_start), '-')
    const extracted = mapChars(utt.slice(char_start, char_end), '^')
    const after = mapChars(utt.slice(char_end), '-')
    logger.debug(`${before}${chalk.green(extracted)}${after}`, `(${confidence.toFixed(2)})`)
  }
}

const runBenchmark = (benchmark: bench.BenchMark): void => {
  logger.info(`Start benchmark: ${chalk.yellowBright(benchmark.name)} (${ITERATIONS} iterations)`)
  const t0 = Date.now()
  for (let i = 0; i < ITERATIONS; i++) {
    for (const utt of benchmark.utterances) {
      runExtraction(utt, benchmark.entities)
    }
  }
  const t1 = Date.now()
  logger.info(`Time: ${t1 - t0}ms`)
}

runBenchmark(bench.benchmark1)
