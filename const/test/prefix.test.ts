import { describe, it, expect } from 'vitest'
import { prefixToObjectMap } from '../src'

describe('prefix', () => {
  it('should be at most 7 characters long', () => {
    const keys = Object.keys(prefixToObjectMap)

    for (const key of keys) {
      expect(key.length, `Prefix "${key}" is too long`).toBeLessThanOrEqual(7)
    }
  })
})
