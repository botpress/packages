/**
 * # Test Utilities
 *
 * This file has extension `.util.test.ts`.
 * It is meant to contain test utilities, not to be tested itself.
 * It is ignored by jest.
 *
 * # List Entity Assertion
 *
 * This module exposes utilities to better test list entities.
 */

import { ListEntityParser } from './lists'
import { MapSpans, Span, parseSpans } from './span.util.test'
import { Entity } from './typings'

type EntityExpectation = {
  source?: string
  qty?: number
  name?: string
  value?: string
  confidence?: number
}

export type EntityExpectations<T extends string> = MapSpans<T, EntityExpectation>

export class ListEntityAssert {
  constructor(private _parser: ListEntityParser) {}

  public expectSpans = <T extends string>(templateStr: T) => {
    const { text, spans } = parseSpans(templateStr)
    const entities = this._parser.parse(text)

    return {
      toBe: (...expected: EntityExpectations<T>) => {
        const cases: [string, number | string, number | string][] = []
        for (let i = 0; i < expected.length; i++) {
          let tag = expected[i] as EntityExpectation
          let span = spans[i] as Span<string>

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
            expect(Number(b)).toBeGreaterThanOrEqual(Number(a))
          } else if (['qty', 'start', 'end'].includes(expression)) {
            expect(Number(b)).toEqual(Number(a))
          } else {
            expect(b).toEqual(a)
          }
        }
      }
    }
  }
}
