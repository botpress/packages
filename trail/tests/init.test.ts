import { describe, expect, test } from 'vitest'
import { init, isInitialized } from '../src'

describe('init', () => {
  test('init should be called when TRACING_ENABLED is true', () => {
    process.env.TRACING_ENABLED = 'true'
    init()
    expect(isInitialized()).toBe(true)
  })
})
