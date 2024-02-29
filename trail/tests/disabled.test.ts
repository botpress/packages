import { describe, expect, test } from 'vitest'
import { isEnabled } from '../src/trace'

describe('enabled', () => {
  test('isEnabled should be false without TRACING_ENABLED', () => {
    expect(isEnabled()).toBe(false)
  })
})
