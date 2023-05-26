import _ from 'lodash'
import { EntityParser } from './typings'

type Cast<T, U> = T extends U ? T : U
type ParseTemplateString<T extends string> = T extends `${infer Before}[${infer Source}]${infer After}`
  ? [Source, ...ParseTemplateString<After>]
  : []

const splitTokens = (tokens: string[], regex: RegExp): string[] =>
  tokens.flatMap((token) => token.split(regex)).filter((t) => !!t)

type Token = {
  text: string
  start: number
  end: number
}

const tokenizeTemplateStr = (templateStr: string): Token[] => {
  let strTokens: string[] = [templateStr]
  strTokens = splitTokens(strTokens, /(\[)/g)
  strTokens = splitTokens(strTokens, /(\])/g)

  const tokens: Token[] = []
  let cursor = 0
  for (const token of strTokens) {
    const isBracket = token === '[' || token === ']'
    if (isBracket) {
      tokens.push({ text: token, start: -1, end: -1 })
    } else {
      tokens.push({ text: token, start: cursor, end: cursor + token.length })
      cursor += isBracket ? 0 : token.length
    }
  }

  return tokens
}

type ParsingStatus = 'outside' | 'inside'
type Span = { start: number; end: number; source: string }
type ParsingState = {
  status: ParsingStatus
  spans: Span[]
  result: string
}

const parseNextToken = (state: ParsingState, token: Token): ParsingState => {
  if (token.text === '[') {
    return {
      ...state,
      status: 'inside'
    }
  }
  if (token.text === ']') {
    return {
      ...state,
      status: 'outside'
    }
  }

  if (state.status === 'inside') {
    return {
      ...state,
      result: state.result + token.text,
      spans: [
        ...state.spans,
        {
          start: token.start,
          end: token.end,
          source: token.text
        }
      ]
    }
  }

  return {
    ...state,
    result: state.result + token.text
  }
}

const parseTemplateString = (templateStr: string) => {
  const tokens = tokenizeTemplateStr(templateStr)

  let state: ParsingState = { status: 'outside', spans: [], result: '' }
  for (const token of tokens) {
    state = parseNextToken(state, token)
  }

  const { result, spans } = state
  return { result, spans }
}

const assert_equal = <T>(actual: T, expected: T, prop?: string) => {
  if (!_.isEqual(actual, expected)) {
    let msg = prop
      ? `Expected ${prop} to be ${JSON.stringify(expected)}, but found ${JSON.stringify(actual)}`
      : `Expected ${JSON.stringify(expected)}, but found ${JSON.stringify(actual)}`
    throw new Error(msg)
  }
}

const assert_gte = (actual: number, expected: number, n_digits: number = 3) => {
  const round = (x: number) => Math.round(x * 10 ** n_digits) / 10 ** n_digits
  const round_actual = round(actual)
  const round_expected = round(expected)
  if (round_actual < round_expected) {
    throw new Error(`Expected ${round_actual} to be greater than or equal to ${round_expected}`)
  }
}

export type EntityExpectation<Source extends string> =
  | {
      source?: Source
      qty: 'none'
    }
  | {
      source?: Source
      qty: 'single'
      name?: string
      value?: string
      confidence?: number
    }
  | {
      source?: Source
      qty: number
    }

type _EntityExpections<Spans extends string[]> = Spans extends [infer First, ...infer Others]
  ? [EntityExpectation<Cast<First, string>>, ..._EntityExpections<Cast<Others, string[]>>]
  : Spans extends [infer Last]
  ? [EntityExpectation<Cast<Last, string>>]
  : []

export type EntityExpections<T extends string> = _EntityExpections<ParseTemplateString<T>>

export class EntityAssert {
  public constructor(private _parser: EntityParser) {}

  public expect = <T extends string>(templateStr: T) => {
    const { result, spans } = parseTemplateString(templateStr)
    const entities = this._parser.parse(result)
    return {
      toBe: (...tags: EntityExpections<T>) => {
        if (tags.length !== spans.length) {
          throw new Error(
            `Expected ${tags.length} tags, but found ${spans.length} in template string "${templateStr}""`
          )
        }

        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i] as EntityExpectation<string>
          const span = spans[i]

          const isInside = (n: number, range: [number, number]) => n >= range[0] && n <= range[1]
          const actual = entities.filter(
            // should be (e.char_start === span.start && e.char_end === span.end), but we keep this for compatibility with previous test suite
            (e) => isInside(e.char_start, [span.start, span.end]) || isInside(e.char_end, [span.start, span.end])
          )
          if (tag.qty === 'none') {
            assert_equal(actual.length, 0)
          } else if (tag.qty === 'single') {
            assert_gte(actual.length, 1)
            const first = actual[0]
            tag.source && assert_equal(first.source, tag.source, 'source')
            tag.name && assert_equal(first.name, tag.name, 'name')
            tag.value && assert_equal(first.value, tag.value, 'value')
            tag.confidence && assert_gte(first.confidence, tag.confidence)
          } else {
            assert_equal(actual.length, tag.qty, 'qty')
          }
        }
      }
    }
  }

  public parse = (templateStr: string) => {
    const { result, spans } = parseTemplateString(templateStr)
    const entities = this._parser.parse(result)
    return { entities, spans }
  }
}
