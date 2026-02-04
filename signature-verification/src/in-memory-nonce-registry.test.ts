import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInMemoryNonceRegistry } from './in-memory-nonce-registry'
import { SIGNATURE_VALIDATION_WINDOW_MS } from './constants'

describe.concurrent(createInMemoryNonceRegistry, () => {
  describe.concurrent('isReplayedRequest', () => {
    it('should allow unseen signature hashes', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 100 })
      const signatureHash = 'hash1'
      const timestamp = Date.now()

      // Act
      const result = nonceRegistry.isReplayedRequest({ signatureHash, timestamp })

      // Assert
      expect(result).toBeFalsy()
    })

    it('should detect replays of a seen signature hash with a different timestamp', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 100 })
      const signatureHash = 'hash1'
      const timestamp = Date.now()

      nonceRegistry.isReplayedRequest({ signatureHash, timestamp })

      // Act
      const result = nonceRegistry.isReplayedRequest({ signatureHash, timestamp: timestamp + 1000 })

      // Assert
      expect(result).toBeTruthy()
    })

    it('should detect replays of a seen signature hash with the same timestamp', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 100 })
      const signatureHash = 'hash1'
      const timestamp = Date.now()

      nonceRegistry.isReplayedRequest({ signatureHash, timestamp })

      // Act
      const result = nonceRegistry.isReplayedRequest({ signatureHash, timestamp })

      // Assert
      expect(result).toBeTruthy()
    })

    it('should allow distinct signature hashes', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 100 })
      const timestamp = Date.now()

      // Act
      const result1 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp })
      const result2 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash2', timestamp })
      const result3 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash3', timestamp })

      // Assert
      expect(result1).toBeFalsy()
      expect(result2).toBeFalsy()
      expect(result3).toBeFalsy()
    })
  })

  describe('cleanup mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should schedule cleanup when max size is reached', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 3 })
      const timestamp = Date.now()

      nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash2', timestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash3', timestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash4', timestamp })

      // Act
      vi.advanceTimersByTime(1)
      // (At this point, the oldest entry, which is hash1, should get evicted)
      const result1 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp })
      const result2 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash2', timestamp })
      const result3 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash3', timestamp })
      const result4 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash4', timestamp })

      // Assert
      expect(result1).toBeFalsy()
      expect(result2).toBeTruthy()
      expect(result3).toBeTruthy()
      expect(result4).toBeTruthy()

      // Act
      vi.advanceTimersByTime(1)
      // (hash2 is now the oldest and should get evicted)
      const result5 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp })
      const result6 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash2', timestamp })
      const result7 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash3', timestamp })
      const result8 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash4', timestamp })

      // Assert
      expect(result5).toBeTruthy()
      expect(result6).toBeFalsy()
      expect(result7).toBeTruthy()
      expect(result8).toBeTruthy()
    })

    it('should remove expired entries during cleanup', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 5 })
      const expiredTimestamp = Date.now() - SIGNATURE_VALIDATION_WINDOW_MS - 1
      const validTimestamp = Date.now()

      nonceRegistry.isReplayedRequest({ signatureHash: 'expiredHash1', timestamp: expiredTimestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'expiredHash2', timestamp: expiredTimestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'validHash1', timestamp: validTimestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'validHash2', timestamp: validTimestamp })
      nonceRegistry.isReplayedRequest({ signatureHash: 'validHash3', timestamp: validTimestamp })

      // Act
      vi.advanceTimersByTime(1)
      const expiredResult1 = nonceRegistry.isReplayedRequest({ signatureHash: 'expiredHash1', timestamp: Date.now() })
      const expiredResult2 = nonceRegistry.isReplayedRequest({ signatureHash: 'expiredHash2', timestamp: Date.now() })
      const validResult1 = nonceRegistry.isReplayedRequest({ signatureHash: 'validHash1', timestamp: Date.now() })
      const validResult2 = nonceRegistry.isReplayedRequest({ signatureHash: 'validHash2', timestamp: Date.now() })
      const validResult3 = nonceRegistry.isReplayedRequest({ signatureHash: 'validHash3', timestamp: Date.now() })

      // Assert
      expect(expiredResult1).toBeFalsy()
      expect(expiredResult2).toBeFalsy()
      expect(validResult1).toBeTruthy()
      expect(validResult2).toBeTruthy()
      expect(validResult3).toBeTruthy()
    })

    it('should remove expired entries even when timestamps are out of order', () => {
      // Arrange
      using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 5 })

      // Use timestamps that are expired (we want to test cleanup of expired entries):
      const expiredTime = Date.now() - SIGNATURE_VALIDATION_WINDOW_MS * 2

      // Scenario: older timestamp arrives later in the queue (network delays):
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp: expiredTime })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash2', timestamp: expiredTime + 60_000 })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash3', timestamp: expiredTime - 65_000 })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash4', timestamp: expiredTime + 120_000 })
      nonceRegistry.isReplayedRequest({ signatureHash: 'hash5', timestamp: expiredTime + 180_000 })

      // Act
      vi.advanceTimersByTime(1)

      // Assert - all expired hashes should be removed:
      const result1 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp: Date.now() })
      const result2 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash2', timestamp: Date.now() })
      const result3 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash3', timestamp: Date.now() })
      const result4 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash4', timestamp: Date.now() })
      const result5 = nonceRegistry.isReplayedRequest({ signatureHash: 'hash5', timestamp: Date.now() })

      expect(result1).toBeFalsy()
      expect(result2).toBeFalsy()
      expect(result3).toBeFalsy()
      expect(result4).toBeFalsy()
      expect(result5).toBeFalsy()
    })
  })
})
