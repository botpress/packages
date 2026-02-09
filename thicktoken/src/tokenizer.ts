import cl100k_base from 'tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from 'tiktoken/lite/init'
import { deepClone, mapValues, uniq } from './utils'

let tokenizer: TextTokenizer | null = null
let lock: Promise<void> | false = false

const CHUNK_SIZE = 100_000

class TokenCollection {
  public constructor(private _tokenizer: Tiktoken, private _modelOutput: Uint32Array<ArrayBufferLike>) {}

  public get length(): number {
    return this._modelOutput.length
  }

  public slice(start: number, end?: number): string[] {
    ;[start, end] = this._clampIndexes(start, end)
    if (start >= end) {
      return []
    }

    const decoder = new TextDecoder()
    const str: string[] = []

    for (let i = start; i < end; i++) {
      const token = this._modelOutput[i]!
      str.push(this._decodeToken(decoder, token))
    }

    return str
  }

  private _decodeToken(decoder: TextDecoder, encodedToken: number): string {
    // copying to a new array because of memory allocation in WASM
    const copy = this._tokenizer.decode(new Uint32Array([encodedToken]))
    return decoder.decode(copy)
  }

  private _clampIndexes(start: number, end?: number): [number, number] {
    const max = this._modelOutput.length

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

  constructor(private tokenizer: Tiktoken) {
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

  private *splitIntoChunks(text: string): Generator<string> {
    const MARGIN = 1000
    for (let i = 0; i < text.length; ) {
      if (i + CHUNK_SIZE >= text.length) {
        yield text.slice(i)
        i += CHUNK_SIZE
        break
      }

      const next = text.slice(i + CHUNK_SIZE - MARGIN, i + CHUNK_SIZE)
      const unsafe = this.split(next).slice(-1)[0]!.length

      yield text.slice(i, i + CHUNK_SIZE - unsafe)

      i += CHUNK_SIZE - unsafe
    }
  }

  private truncate_reverse(text: string, maxTokens: number): string {
    const decoder = new TextDecoder()
    let charsToTruncate = 0
    let truncatedTokens = 0

    const chunks = [...this.splitIntoChunks(text)].reverse()

    master: for (const chunk of chunks) {
      const tokens = this.tokenizer.encode(chunk ?? '').reverse()

      for (const token of tokens) {
        truncatedTokens += 1
        charsToTruncate += decoder.decode(this.tokenizer.decode(new Uint32Array([token]))).length

        if (truncatedTokens >= maxTokens) {
          break master
        }
      }
    }

    return text.slice(0, -charsToTruncate)
  }

  public truncate(text: string, maxTokens: number): string {
    if (maxTokens < 0) {
      return this.truncate_reverse(text, -maxTokens)
    }

    const decoder = new TextDecoder()
    let truncatedText = ''
    let remainingTokens = maxTokens

    for (const chunk of this.splitIntoChunks(text)) {
      const tokens = this.tokenizer.encode(chunk ?? '')

      if (tokens.length <= remainingTokens) {
        truncatedText += chunk
        remainingTokens -= tokens.length
      } else {
        const truncatedTokens = tokens.slice(0, remainingTokens)
        truncatedText += decoder.decode(this.tokenizer.decode(truncatedTokens))
        break
      }
    }

    return truncatedText
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

    const tokens = this.count(Object.values(object).join(''))
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
        toTruncate -= this.count(value) - this.count(truncatedValue)
      } else {
        toTruncate -= this.count(value)
      }
    }

    if (toTruncate > 0) {
      throw new Error('Unable to truncate object')
    }

    return newObject
  }

  public split(text: string): string[] {
    const output = this.tokenizer.encode(text ?? '')
    const collection = new TokenCollection(this.tokenizer, output)
    return collection.slice(0)
  }

  public splitAndSlice(text: string): TokenCollection {
    const output = this.tokenizer.encode(text ?? '')
    return new TokenCollection(this.tokenizer, output)
  }

  /**
   * Counts the number of tokens, up to a fixed ceiling, after which we return
   * The reason to have a ceiling is to avoid performance issues with very large texts
   */
  public count(text: string, max: number = 1_000_000): number {
    let total = 0
    for (const chunk of this.splitIntoChunks(text)) {
      const tokens = this.tokenizer.encode(chunk ?? '')
      total += tokens.length
      if (total > max) {
        break
      }
    }

    return total
  }
}

const initialize = async () => {
  const bytes = (await import('tiktoken/lite/tiktoken_bg.wasm')).default
  await init((imports) => WebAssembly.instantiate(bytes, imports))
  const _tokenizer = new Tiktoken(cl100k_base.bpe_ranks, cl100k_base.special_tokens, cl100k_base.pat_str)
  tokenizer = new TextTokenizer(_tokenizer)
}

export const getWasmTokenizer = async () => {
  if (tokenizer) {
    return tokenizer
  }

  if (lock) {
    await lock
  } else {
    lock = initialize()
    await lock
    lock = false
  }

  if (!tokenizer) {
    throw new Error('Tokenizer failed to initialize')
  }

  return tokenizer!
}
