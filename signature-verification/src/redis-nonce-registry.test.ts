import { describe, expect, it, vi } from 'vitest'
import { createRedisNonceRegistry } from './redis-nonce-registry'
import type { RedisClient } from './types'

describe.concurrent(createRedisNonceRegistry, () => {
  const _getMocks = () => {
    const mockRedisClient: RedisClient = {
      set: vi.fn().mockResolvedValue('OK'),
    }
    return { mockRedisClient }
  }

  describe.concurrent('isReplayedRequest', () => {
    it('should allow new signature hash when Redis returns OK', async () => {
      const { mockRedisClient } = _getMocks()
      using nonceRegistry = createRedisNonceRegistry({ client: mockRedisClient })
      const signatureHash = 'hash1'
      const timestamp = Date.now()

      const result = await nonceRegistry.isReplayedRequest({ signatureHash, timestamp })

      expect(result).toBeFalsy()
      expect(mockRedisClient.set).toHaveBeenCalledWith('replay:hash1', '1', 'NX', 'PX', 10 * 60 * 1000)
    })

    it('should detect replay when Redis returns null', async () => {
      const { mockRedisClient } = _getMocks()
      mockRedisClient.set = vi.fn().mockResolvedValue(null)
      using nonceRegistry = createRedisNonceRegistry({ client: mockRedisClient })
      const signatureHash = 'hash1'
      const timestamp = Date.now()

      const result = await nonceRegistry.isReplayedRequest({ signatureHash, timestamp })

      expect(result).toBeTruthy()
    })
  })

  describe.concurrent('fail-open behavior (default)', () => {
    it('should allow request when Redis throws error with default failOpen', async () => {
      const { mockRedisClient } = _getMocks()
      mockRedisClient.set = vi.fn().mockRejectedValue(new Error('Redis connection failed'))
      using nonceRegistry = createRedisNonceRegistry({ client: mockRedisClient })

      const result = await nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp: Date.now() })

      expect(result).toBeFalsy()
    })

    it('should allow request when Redis throws error with explicit failOpen=true', async () => {
      const { mockRedisClient } = _getMocks()
      mockRedisClient.set = vi.fn().mockRejectedValue(new Error('Redis timeout'))
      using nonceRegistry = createRedisNonceRegistry({ client: mockRedisClient, failOpen: true })

      const result = await nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp: Date.now() })

      expect(result).toBeFalsy()
    })
  })

  describe.concurrent('fail-closed behavior', () => {
    it('should reject request when Redis throws error with failOpen=false', async () => {
      const { mockRedisClient } = _getMocks()
      mockRedisClient.set = vi.fn().mockRejectedValue(new Error('Redis unavailable'))
      using nonceRegistry = createRedisNonceRegistry({ client: mockRedisClient, failOpen: false })

      const result = await nonceRegistry.isReplayedRequest({ signatureHash: 'hash1', timestamp: Date.now() })

      expect(result).toBeTruthy()
    })
  })
})
