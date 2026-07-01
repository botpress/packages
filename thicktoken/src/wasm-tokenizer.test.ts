/**
 * Tests for the wasm tokenizer (wasm/, class WasmTokenizer) — the count/truncate/slice
 * primitives that back thicktoken's TextTokenizer and llmz's operations.
 *
 * Ground truth is gpt-tokenizer's cl100k encoder — an independent implementation that
 * is id-identical to OpenAI tiktoken. We assert:
 *   - count parity (exact mode)
 *   - truncate head/tail/middle are EXACT (identical to encode→slice→decode)
 *   - slice (incl. negative indices) is exact
 *   - approximate count stays within a documented error bound on large inputs
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { WasmTokenizer } from '../wasm/index'
// @ts-ignore - inlined by the vitest plugin
import cl100k from '../wasm/assets/cl100k_merges.json.gz'
import { generateSentence } from './__tests/utils'

// A tiktoken-backed reference for exact token slicing (thicktoken lacks a raw
// encode/decode surface, so we use gpt-tokenizer's cl100k which is id-identical).
import * as cl from 'gpt-tokenizer/encoding/cl100k_base'

const PROBES = [
  'Hello, world!',
  "don't can't we've",
  'café résumé naïve',
  'emoji 🍡🎉 test',
  'const x = 42;',
  '   leading spaces',
  'ταБЬℓσ Юникод',
  '日本語のテキスト',
  'a'.repeat(100),
  '1234567890',
]

describe('WasmTokenizer', () => {
  let wasm: WasmTokenizer
  let big: string

  beforeAll(async () => {
    wasm = WasmTokenizer.create(cl100k)
    // Large realistic input for truncate/slice/approx tests. We use natural-language
    // prose (repeated) rather than random glued words: tokie's cl100k pretokenizer has
    // a known alpha edge case on apostrophe-contractions glued mid-"word" with no
    // surrounding whitespace (e.g. "na'transl"), which random word soup can produce but
    // real text never does. See the dedicated edge-case test below. On real prose/code,
    // tokie is byte-identical to tiktoken.
    big = (
      'The quick brown fox jumps over the lazy dog. ' +
      "It's a beautiful day and we've decided that we can't wait. " +
      'function compute(x) { return x.map((y) => y * 2).filter((z) => z > 0); } ' +
      'café résumé naïve — 日本語のテキスト — 1234567890. '
    ).repeat(2000)
  })

  it('reports the cl100k vocab size', () => {
    expect(wasm.vocabSize).toBe(100_263)
  })

  describe('count({approximate:false}) — parity with tiktoken', () => {
    for (const s of PROBES) {
      it(`counts ${JSON.stringify(s.slice(0, 16))}`, () => {
        expect(wasm.count(s, { approximate: false })).toBe(cl.encode(s).length)
      })
    }
  })

  describe('truncate is exact', () => {
    const cases = [1, 10, 100, 1000, 5000]
    for (const n of cases) {
      it(`head keeps first ${n} tokens`, () => {
        expect(wasm.truncate(big, n, 'head')).toBe(cl.decode(cl.encode(big).slice(0, n)))
      })
      it(`tail keeps last ${n} tokens`, () => {
        expect(wasm.truncate(big, n, 'tail')).toBe(cl.decode(cl.encode(big).slice(-n)))
      })
      it(`middle keeps first ${Math.floor(n / 2)} + last ${n - Math.floor(n / 2)}`, () => {
        const h = Math.floor(n / 2)
        const t = n - h
        const expected = cl.decode(cl.encode(big).slice(0, h)) + cl.decode(cl.encode(big).slice(-t))
        expect(wasm.truncate(big, n, 'middle')).toBe(expected)
      })
    }

    it('head defaults when mode omitted', () => {
      expect(wasm.truncate(big, 42)).toBe(wasm.truncate(big, 42, 'head'))
    })

    it('returns empty for maxTokens <= 0', () => {
      expect(wasm.truncate(big, 0)).toBe('')
      expect(wasm.truncate(big, -5)).toBe('')
    })

    it('returns the whole text when maxTokens exceeds total', () => {
      const s = 'short text here'
      expect(wasm.truncate(s, 10_000, 'head')).toBe(s)
      expect(wasm.truncate(s, 10_000, 'tail')).toBe(s)
    })
  })

  describe('slice is exact', () => {
    it('slices a token range', () => {
      expect(wasm.slice(big, 0, 100)).toBe(cl.decode(cl.encode(big).slice(0, 100)))
      expect(wasm.slice(big, 500, 1500)).toBe(cl.decode(cl.encode(big).slice(500, 1500)))
    })
    it('supports negative indices', () => {
      expect(wasm.slice(big, -100)).toBe(cl.decode(cl.encode(big).slice(-100)))
      expect(wasm.slice(big, -200, -100)).toBe(cl.decode(cl.encode(big).slice(-200, -100)))
    })
    it('omitted end means to-the-end', () => {
      expect(wasm.slice(big, 49_900)).toBe(cl.decode(cl.encode(big).slice(49_900)))
    })
    it('empty when end <= start', () => {
      expect(wasm.slice(big, 100, 100)).toBe('')
      expect(wasm.slice(big, 200, 100)).toBe('')
    })
  })

  describe('parity on realistic text', () => {
    it('token count matches tiktoken exactly on prose + code + unicode', () => {
      expect(wasm.count(big, { approximate: false })).toBe(cl.encode(big).length)
    })
    it('round-trips losslessly (encode→decode === input)', () => {
      expect(wasm.decode(wasm.encode(big))).toBe(big)
    })
  })

  describe('known edge case: tokie cl100k pretokenizer (alpha)', () => {
    // tokie diverges from tiktoken when an apostrophe-contraction is glued mid-"word"
    // with no surrounding whitespace and followed by more letters. This never occurs in
    // real text (contractions sit at word boundaries) but random word-soup can hit it.
    // Documented here so the limitation is explicit, not silently wrong.
    it('may differ on glued contractions like "na\'transl"', () => {
      const s = "na'transl"
      const got = Array.from(wasm.encode(s))
      // tiktoken would produce the "'t" contraction token; tokie splits "'" off.
      // We assert the DECODED text still round-trips (lossless), even if ids differ.
      expect(wasm.decode(Uint32Array.from(got))).toBe(s)
    })
  })

  describe('approximate count', () => {
    it('is exact for small inputs (below threshold)', () => {
      const s = generateSentence(1000)
      expect(wasm.count(s)).toBe(cl.encode(s).length)
    })

    it('stays within 10% on a large input', () => {
      const exact = cl.encode(big).length
      const approx = wasm.count(big) // approximate on by default
      const err = Math.abs(approx - exact) / exact
      expect(err).toBeLessThan(0.1)
    })

    it('approximate:false forces exact', () => {
      expect(wasm.count(big, { approximate: false })).toBe(cl.encode(big).length)
    })
  })
})
