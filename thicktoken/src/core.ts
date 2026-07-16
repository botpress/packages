import { WasmTokenizer, type CountOptions, type TruncateMode } from '../wasm/index'
import { deepClone, mapValues, uniq } from './utils'

export class TokenCollection {
  public constructor(private _tokens: string[]) {}

  public get length(): number {
    return this._tokens.length
  }

  public slice(start: number, end?: number): string[] {
    ;[start, end] = this._clampIndexes(start, end)
    if (start >= end) {
      return []
    }
    return this._tokens.slice(start, end)
  }

  private _clampIndexes(start: number, end?: number): [number, number] {
    const max = this._tokens.length

    end ??= max

    start = start < 0 ? max + start : start
    end = end < 0 ? max + end : end

    start = Math.max(0, Math.min(start, max))
    end = Math.max(0, Math.min(end, max))

    return [start, end]
  }
}

export class TextTokenizer {
  private warnOnSlowCalls = true

  constructor(private tokenizer: WasmTokenizer) {
    this.truncate = this.wrapWithWarning('truncate', this.truncate.bind(this))
    this.truncateObject = this.wrapWithWarning('truncateObject', this.truncateObject.bind(this))
    this.split = this.wrapWithWarning('split', this.split.bind(this))
    this.count = this.wrapWithWarning('count', this.count.bind(this))
  }

  private wrapWithWarning(name: string, fn: Function) {
    return (...args: any[]) => {
      const start = Date.now()
      const result = fn(...args)
      const duration = Date.now() - start

      if (duration > 500 && this.warnOnSlowCalls) {
        console.warn(`Tokenizer.${name} took ${duration}ms`)
      }

      return result
    }
  }

  /**
   * Truncates to `maxTokens` tokens, keeping the part selected by `mode`:
   *  - `'head'` (default) — the first N tokens
   *  - `'tail'` — the last N tokens
   *  - `'middle'` — the first N/2 and last N/2, dropping the middle
   *
   * Exact, and fast on huge inputs — only tokenizes the window it needs. A
   * negative count removes |N| tokens from the end (historical API; `mode` is
   * ignored in that case).
   */
  public truncate(text: string, maxTokens: number, mode: TruncateMode = 'head'): string {
    text ??= ''
    if (maxTokens === 0) {
      return ''
    }

    if (maxTokens < 0) {
      // remove |maxTokens| tokens from the end: find the trailing-token substring
      // (fast suffix window) and cut it off the original text
      const tail = this.tokenizer.truncate(text, -maxTokens, 'tail')
      return text.slice(0, text.length - tail.length)
    }

    return this.tokenizer.truncate(text, maxTokens, mode)
  }

  public truncateObject<T extends PropertyKey>(
    object: Record<T, string>,
    maxTokens: number,
    truncateOrder: T[]
  ): Record<T, string> {
    if (maxTokens < 0) {
      throw new Error('maxTokens must be a positive integer')
    }

    if (maxTokens === 0) {
      return mapValues(object, () => '')
    }

    // budget accounting must balance exactly, so force exact counts here
    const exact = { approximate: false } as const
    const tokens = this.count(Object.values(object).join(''), exact)
    let toTruncate = tokens - maxTokens
    const newObject = deepClone(object) as Record<T, string>
    const keys = uniq([...truncateOrder, ...Object.keys(object)]) as T[]

    while (toTruncate > 0) {
      const key = keys.shift()
      if (!key) {
        break
      }
      const value = newObject[key]
      const truncatedValue = this.truncate(value, -toTruncate)
      newObject[key] = truncatedValue
      if (truncatedValue.length) {
        toTruncate -= this.count(value, exact) - this.count(truncatedValue, exact)
      } else {
        toTruncate -= this.count(value, exact)
      }
    }

    if (toTruncate > 0) {
      throw new Error('Unable to truncate object')
    }

    return newObject
  }

  /** One decoded string per token. */
  public split(text: string): string[] {
    return this.tokenizer.split(text ?? '')
  }

  public splitAndSlice(text: string): TokenCollection {
    return new TokenCollection(this.tokenizer.split(text ?? ''))
  }

  /**
   * Counts tokens. Approximate by default on very large inputs (statistical
   * sampling, within a few %) — pass `{ approximate: false }` for an exact count.
   */
  public count(text: string, options: CountOptions = {}): number {
    return this.tokenizer.count(text ?? '', options)
  }
}

/**
 * Builds a memoized async `getWasmTokenizer` for a specific vocab asset. Each
 * package entry (`.` full cl100k, `./lite` cl50k, `./micro` cl25k) bundles its
 * own asset bytes and exposes its own getter.
 */
export const makeGetTokenizer = (assetGz: Uint8Array) => {
  let tokenizer: TextTokenizer | null = null
  return async (): Promise<TextTokenizer> => {
    if (!tokenizer) {
      tokenizer = new TextTokenizer(WasmTokenizer.create(assetGz))
    }
    return tokenizer
  }
}

export { WasmTokenizer, type CountOptions, type TruncateMode }
