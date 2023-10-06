/**
 * # Test Utilities
 *
 * This file has extension `.util.test.ts`.
 * It is meant to contain test utilities, not to be tested itself.
 * It is ignored by vitest.
 *
 * # Span Assertions
 *
 * This module exposes utilities to better test text spans.
 * It prevents testing spans like this:
 *
 * ```ts
 *   const text = "this is an apple made of gold"
 *   //            01234567890123456789012345678
 *   //            00000000001111111111222222222
 *   const res = doSomething(text)
 *   expect(res.start).toBe(11)
 *   expect(res.end).toBe(16)
 *   expect(res.source).toBe("apple")
 * ```
 *
 * Instead, you can test spans like this:
 *
 * ```ts
 *   const text = "this is an [apple] made of gold"
 *   const spanAssert = new SpanAssert()
 *   spanAssert.expectSpans(text).toBe({ source: "apple" })
 * ```
 */

import _ from 'lodash'

type Cast<T, U> = T extends U ? T : U

type ParseTemplateString<T extends string> = T extends `${infer _Before}[${infer Source}]${infer After}`
  ? [Source, ...ParseTemplateString<After>]
  : []
type CleanTemplateString<T extends string> = T extends `${infer Before}[${infer Source}]${infer After}`
  ? `${Before}${Source}${CleanTemplateString<After>}`
  : T

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
type ParsingState = {
  status: ParsingStatus
  spans: { start: number; end: number; source: string }[]
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

type ToSpan<S extends string[]> = S extends [infer Head, ...infer Tail]
  ? [Span<Cast<Head, string>>, ...ToSpan<Cast<Tail, string[]>>]
  : []

type _MapSpans<S extends any[], U> = S extends [infer Head, ...infer Tail] ? [U, ..._MapSpans<Tail, U>] : []

export type Span<Source extends string = string> = { start: number; end: number; source: Source }
export type MapSpans<T extends string, U> = _MapSpans<ParseTemplateString<T>, U>
export type Parsed<T extends string = string> = {
  text: CleanTemplateString<T>
  spans: ToSpan<ParseTemplateString<T>>
}

export const parseSpans = <T extends string>(templateStr: T): Parsed<T> => {
  const { result, spans } = parseTemplateString(templateStr)
  return { text: result, spans: spans } as Parsed<T>
}
