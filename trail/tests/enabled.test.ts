import { describe, expect, test } from 'vitest'
import { isEnabled } from '../src/trace'

describe('enabled', () => {
  test('isEnabled should be true with TRACING_ENABLED true', () => {
    process.env.TRACING_ENABLED = 'true'
    expect(isEnabled()).toBe(true)
  })
})
