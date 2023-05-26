import _ from 'lodash'
import { Entity, EntityParser } from './typings'

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

export type EntityExpectation = {
  source?: string
  qty?: number
  name?: string
  value?: string
  confidence?: number
}

type _EntityExpectations<Spans extends string[]> = Spans extends [infer First, ...infer Others]
  ? [EntityExpectation, ..._EntityExpectations<Cast<Others, string[]>>]
  : Spans extends [infer Last]
  ? [EntityExpectation]
  : []

export type EntityExpectations<T extends string> = _EntityExpectations<ParseTemplateString<T>>

export class EntityAssert {
  public constructor(private _parser: EntityParser) {}

  public expect = <T extends string>(templateStr: T) => {
    const { result, spans } = parseTemplateString(templateStr)
    const entities = this._parser.parse(result)
    return {
      toBe: (...tags: EntityExpectations<T>) => {
        if (tags.length !== spans.length) {
          throw new Error(
            `Expected ${tags.length} tags, but found ${spans.length} in template string "${templateStr}""`
          )
        }

        /** Conditions copied from old test suite */

        const cases: [string, number | string, number | string][] = []
        for (let i = 0; i < tags.length; i++) {
          let tag = tags[i] as EntityExpectation
          let span = spans[i]

          let e: Entity | undefined = undefined

          const found = entities.filter(
            (x) =>
              (x.char_start >= span.start && x.char_start < span.end) ||
              (x.char_end <= span.end && x.char_end > span.start)
          )

          if (tag.qty) {
            cases.push(['qty', tag.qty, found.length])
          }
          if (tag.name) {
            e = found.find((x) => x.name === tag.name)
            cases.push(['type', tag.name, e ? e.name : 'N/A'])
          }
          if (tag.value) {
            e = found.find((x) => x.value === tag.value)
            cases.push(['value', tag.value, e ? e.value : 'N/A'])
          }
          if (tag.confidence && e) {
            cases.push(['confidence', tag.confidence, e.confidence])
          }

          if (e) {
            cases.push(['start', span.start, e.char_start])
            cases.push(['end', span.end, e.char_end])
          }
        }

        for (const [expression, a, b] of cases) {
          if (expression === 'confidence') {
            assert_gte(Number(b), Number(a))
          } else if (['qty', 'start', 'end'].includes(expression)) {
            assert_equal(Number(b), Number(a), expression)
          } else {
            assert_equal(b, a, expression)
          }
        }
      }
    }
  }
}
