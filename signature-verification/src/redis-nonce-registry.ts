import type { RedisClient, SignatureNonceRegistry } from './types'
import { SIGNATURE_VALIDATION_WINDOW_MS } from './constants'

type Logger = {
  error: (message: string, ...args: unknown[]) => void
}

const REDIS_KEY_PREFIX = 'replay:'

class RedisNonceRegistry implements SignatureNonceRegistry {
  private readonly _shouldAllowRequestsOnRedisError: boolean
  private readonly _redisClient: RedisClient
  private readonly _logger?: Logger

  public constructor(params: { client: RedisClient; failOpen?: boolean; logger?: Logger }) {
    this._redisClient = params.client
    this._shouldAllowRequestsOnRedisError = params.failOpen ?? true
    this._logger = params.logger
  }

  public async isReplayedRequest(request: { signatureHash: string; timestamp: number }): Promise<boolean> {
    const { signatureHash } = request

    try {
      const redisKey = `${REDIS_KEY_PREFIX}${signatureHash}`

      // oxlint-disable-next-line no-magic-numbers
      const setResult = await this._redisClient.set(redisKey, '1', 'NX', 'PX', SIGNATURE_VALIDATION_WINDOW_MS * 2)

      return setResult !== 'OK'
    } catch (redisError) {
      this._logger?.error('Redis replay protection error:', redisError)
      return !this._shouldAllowRequestsOnRedisError
    }
  }

  public [Symbol.dispose](): void {}
}

/**
 * Creates a Redis-based nonce registry for detecting replayed requests.
 *
 * This registry uses Redis to store and check for replayed request signatures,
 * making it suitable for distributed systems where multiple instances need to
 * share replay protection state.
 *
 * @param params - Configuration options for the Redis nonce registry.
 * @param params.client - The Redis client instance to use for storing nonces.
 * @param params.failOpen - Whether to allow requests when Redis is unavailable.
 *   When `true` (default), requests will be allowed if Redis fails.
 *   When `false`, requests will be rejected if Redis fails.
 * @param params.logger - Optional logger for error reporting.
 *
 * @returns A new `RedisNonceRegistry` instance.
 *
 * @example
 * ```typescript
 * using nonceRegistry = createRedisNonceRegistry({
 *   client: redisClient,
 *   failOpen: true,
 *   logger: console,
 * })
 *
 * // Use within createSignatureVerifier:
 * const signatureVerifier = createSignatureVerifier({
 *   sharedSecrets: ['my-shared-secret'],
 *   signatureNonceRegistry: nonceRegistry
 * })
 * ```
 */
export const createRedisNonceRegistry = (params: {
  client: RedisClient
  failOpen?: boolean
  logger?: Logger
}): RedisNonceRegistry => new RedisNonceRegistry(params)
