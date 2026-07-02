/**
 * Tests for the vocab variants: `.` (full cl100k), `./lite` (cl50k), `./micro`
 * (cl25k). Truncated variants trade count fidelity for size/init speed; the key
 * invariants are: (1) they only ever OVERCOUNT vs full cl100k (safe direction for
 * budget enforcement), (2) inflation stays within the documented envelope on
 * prose/code, (3) truncate/split behave identically in kind (exact, windowed).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { getWasmTokenizer as getFull, type TextTokenizer } from './tokenizer'
import { getWasmTokenizer as getLite } from './lite'
import { getWasmTokenizer as getMicro } from './micro'
import * as fs from 'fs'
import * as path from 'path'

const PROSE = (
  'It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife. '
).repeat(500)

describe('vocab variants', () => {
  let full: TextTokenizer
  let lite: TextTokenizer
  let micro: TextTokenizer
  let code: string

  beforeAll(async () => {
    full = await getFull()
    lite = await getLite()
    micro = await getMicro()
    code = fs.readFileSync(path.resolve(__dirname, 'core.ts'), 'utf-8').repeat(10)
  })

  it('all variants tokenize and round-trip the basics', () => {
    for (const tok of [full, lite, micro]) {
      expect(tok.count('Hello, world!', { approximate: false })).toBeGreaterThanOrEqual(4)
      expect(tok.truncate('one two three four', 2)).toBe('one two')
      expect(tok.truncate('one two three four', 2, 'tail')).toBe(' three four')
      expect(tok.split('Hello').join('')).toBe('Hello')
    }
  })

  it('full matches cl100k exactly (sanity anchor)', () => {
    expect(full.count('Hello, world!', { approximate: false })).toBe(4)
  })

  it('truncated variants only ever overcount vs full', () => {
    for (const text of [PROSE, code]) {
      const base = full.count(text, { approximate: false })
      expect(lite.count(text, { approximate: false })).toBeGreaterThanOrEqual(base)
      expect(micro.count(text, { approximate: false })).toBeGreaterThanOrEqual(base)
    }
  })

  it('inflation stays within the documented envelope on prose and code', () => {
    for (const text of [PROSE, code]) {
      const base = full.count(text, { approximate: false })
      const liteRatio = lite.count(text, { approximate: false }) / base
      const microRatio = micro.count(text, { approximate: false }) / base
      expect(liteRatio).toBeLessThan(1.1) // documented ~+3-4%, envelope 10%
      expect(microRatio).toBeLessThan(1.2) // documented ~+8-9%, envelope 20%
    }
  })

  it('truncate stays exact per-variant (count of result equals request)', () => {
    for (const tok of [lite, micro]) {
      const kept = tok.truncate(PROSE, 100)
      expect(tok.count(kept, { approximate: false })).toBe(100)
      const tail = tok.truncate(PROSE, 100, 'tail')
      expect(tok.count(tail, { approximate: false })).toBe(100)
    }
  })
})
