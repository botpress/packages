import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { getWasmTokenizer } from '../dist/tokenizer.mjs'
import { type TextTokenizer } from './tokenizer'
import { performance } from 'perf_hooks'
import { generateSentence } from './__tests/utils'

type TaskContext = {
  task: {
    name: string
    meta: {
      start_ts: number
      end_ts: number
    }
  }
}

const num = new Intl.NumberFormat('en-US')
const TIMEOUT = process.env.CI ? 6_000 : 2_000
const SINGLE_TOKEN = ' TOKEN'

describe('performance', () => {
  let tokenizer: TextTokenizer
  beforeAll(async () => {
    tokenizer = await getWasmTokenizer()
  })

  beforeEach<TaskContext>((ctx) => {
    ctx.task.meta.start_ts = performance.now()
  })

  afterEach<TaskContext>((ctx) => {
    ctx.task.meta.end_ts = performance.now()
    const ms = Math.ceil(ctx.task.meta.end_ts - ctx.task.meta.start_ts)
    console.log(ctx.task.name, ms + 'ms')
  })

  describe('tokenizer (performance)', () => {
    describe('truncate', () => {
      const benches = [
        { iterations: 10_000, text_length: 1, take: 1 },
        { iterations: 1_000, text_length: 10, take: 1 },
        { iterations: 100, text_length: 100, take: 10 },
        { iterations: 10, text_length: 1_000, take: 100 },
        { iterations: 1, text_length: 10_000, take: 1_000 },
        { iterations: 1, text_length: 100_000, take: 10_000 },
        { iterations: 1, text_length: 1_000_000, take: 100_000 },
        { iterations: 1, text_length: 10_000_000, take: 100_000 }
      ] as const

      let texts = new Map<(typeof benches)[number], string>()

      beforeAll(() => {
        for (const bench of benches) {
          texts.set(bench, generateSentence(bench.text_length))
        }
      })

      for (const bench of benches) {
        it<TaskContext>(`${num.format(bench.text_length)} x${num.format(bench.iterations)}`, (ctx) => {
          const text = texts.get(bench)!
          for (let i = 0; i < bench.iterations; i++) {
            tokenizer.truncate(text, bench.take)
          }
          expect(performance.now() - ctx.task.meta.start_ts).toBeLessThan(TIMEOUT)
        })
      }
    })

    describe('count (performance)', (test) => {
      const benches = [
        { iterations: 10_000, text_length: 1 },
        { iterations: 1_000, text_length: 10 },
        { iterations: 100, text_length: 100 },
        { iterations: 10, text_length: 1_000 },
        { iterations: 1, text_length: 10_000 },
        { iterations: 1, text_length: 100_000 },
        { iterations: 1, text_length: 1_000_000 },
        { iterations: 1, text_length: 10_000_000 }
      ] as const

      let texts = new Map<(typeof benches)[number], string>()

      beforeAll(() => {
        for (const bench of benches) {
          texts.set(bench, generateSentence(bench.text_length))
        }
      })

      for (const bench of benches) {
        it<TaskContext>(`${num.format(bench.text_length)} x${num.format(bench.iterations)}`, (ctx) => {
          const text = texts.get(bench)!
          for (let i = 0; i < bench.iterations; i++) {
            tokenizer.count(text)
          }
          expect(performance.now() - ctx.task.meta.start_ts).toBeLessThan(TIMEOUT)
        })
      }
    })
  })
})

describe('count', () => {
  let tokenizer: TextTokenizer
  beforeAll(async () => {
    tokenizer = await getWasmTokenizer()
  })

  it('should count the number of tokens', async () => {
    expect(tokenizer.count('Hello, world!')).toBe(4)
    expect(tokenizer.count('const hello = "world";')).toBe(6)
    expect(tokenizer.count('1234567689')).toBe(4)
  })

  it('should count the number of tokens (medium)', async () => {
    expect(tokenizer.count(SINGLE_TOKEN.repeat(123))).toBe(123)
    expect(tokenizer.count(SINGLE_TOKEN.repeat(1111))).toBe(1111)
    expect(tokenizer.count(SINGLE_TOKEN.repeat(4444))).toBe(4444)
    expect(tokenizer.count(SINGLE_TOKEN.repeat(120_000))).toBe(120_000)
  })

  it('should count the number of tokens (overflow)', async () => {
    const overflow = tokenizer.count(SINGLE_TOKEN.repeat(5_000_000))
    expect(tokenizer.count(SINGLE_TOKEN.repeat(1_000_000))).toBe(1_000_000)
    expect(overflow).toBeGreaterThanOrEqual(1_000_000)
    expect(overflow).toBeLessThanOrEqual(1_250_000)
  })
})

describe('split', () => {
  let tokenizer: TextTokenizer
  beforeAll(async () => {
    tokenizer = await getWasmTokenizer()
  })

  it('split works', async () => {
    expect(tokenizer.split('Hello, world!')).toEqual(['Hello', ',', ' world', '!'])
    expect(tokenizer.split(SINGLE_TOKEN.repeat(200_000))).toEqual(Array(200_000).fill(' TOKEN'))
  })
})

describe('truncate', () => {
  let tokenizer: TextTokenizer
  beforeAll(async () => {
    tokenizer = await getWasmTokenizer()
  })

  describe('positive count', () => {
    it('asking for < text length', async () => {
      const begin = 'BEGIN'

      expect(tokenizer.truncate('Hello, world!', 1)).toEqual('Hello')
      expect(tokenizer.truncate('Hello, world!', 2)).toEqual('Hello,')
      expect(tokenizer.truncate('Hello, world!', 3)).toEqual('Hello, world')
      expect(tokenizer.truncate('Hello, world!', 4)).toEqual('Hello, world!')

      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(200_000), 1)).toEqual(begin)
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(200_000), 2000)).toEqual(begin + SINGLE_TOKEN.repeat(1999))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(1_000_000), 2000)).toEqual(
        begin + SINGLE_TOKEN.repeat(1999)
      )

      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(1_000_000), 200_000)).toEqual(
        // Not sure why this is 199_998 instead of 199_999
        begin + SINGLE_TOKEN.repeat(199_998)
      )
    })

    it('asking for > text length', async () => {
      const begin = 'BEGIN'
      expect(tokenizer.truncate('Hello, world!', 6)).toEqual('Hello, world!')

      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(10), 2000)).toEqual(begin + SINGLE_TOKEN.repeat(10))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(100), 2000)).toEqual(begin + SINGLE_TOKEN.repeat(100))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(200_000), 300_000)).toEqual(
        begin + SINGLE_TOKEN.repeat(200_000)
      )
    })
  })

  describe('negative count', () => {
    it('(short) removes specified token count from the end', async () => {
      expect(tokenizer.truncate('Hello, world!', -1)).toEqual('Hello, world')
      expect(tokenizer.truncate('Hello, world!', -2)).toEqual('Hello,')
      expect(tokenizer.truncate('Hello, world!', -3)).toEqual('Hello')
      expect(tokenizer.truncate('Hello, world!', -4)).toEqual('')
      expect(tokenizer.truncate('Hello, world!', -5)).toEqual('')
      expect(tokenizer.truncate('Hello, world!', -1000)).toEqual('')
    })

    it('(long) removes specified token count from the end', async () => {
      const begin = 'BEGIN'
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(100), -1)).toEqual(begin + SINGLE_TOKEN.repeat(99))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(1_000), -1)).toEqual(begin + SINGLE_TOKEN.repeat(999))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(10_000), -1)).toEqual(begin + SINGLE_TOKEN.repeat(9_999))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(100_000), -1)).toEqual(begin + SINGLE_TOKEN.repeat(99_999))
      expect(tokenizer.truncate(begin + SINGLE_TOKEN.repeat(200_000), -100_000)).toEqual(
        // Not sure why this is 100_000 instead of 99_999
        begin + SINGLE_TOKEN.repeat(100_000)
      )
    })
  })
})
