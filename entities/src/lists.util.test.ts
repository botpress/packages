import { expect } from 'vitest'

/**
 * # Test Utilities
 *
 * This file has extension `.util.test.ts`.
 * It is meant to contain test utilities, not to be tested itself.
 * It is ignored by vitest.
 *
 * # List Entity Assertion
 *
 * This module exposes utilities to better test list entities.
 */

import { ListEntityExtractor } from './lists'
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
  constructor(private _extractor: ListEntityExtractor) {}

  public expectSpans = <T extends string>(templateStr: T) => {
    const { text, spans } = parseSpans(templateStr)
    const entities = this._extractor.extract(text)

    return {
      toBe: (...expected: EntityExpectations<T>) => {
        const cases: [string, number | string, number | string][] = []
        for (let i = 0; i < expected.length; i++) {
          let tag = expected[i] as EntityExpectation
          let span = spans[i] as Span<string>

          let e: Entity | undefined = undefined

          const found = entities.filter(
            (x) =>
              (x.charStart >= span.start && x.charStart < span.end) || (x.charEnd <= span.end && x.charEnd > span.start)
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
            cases.push(['start', span.start, e.charStart])
            cases.push(['end', span.end, e.charEnd])
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
