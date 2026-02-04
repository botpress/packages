import type { SignatureNonceRegistry } from './types'
import { SIGNATURE_VALIDATION_WINDOW_MS } from './constants'

class InMemoryNonceRegistry implements SignatureNonceRegistry {
  private _requestQueue = new Map<number, { hash: string; timestamp: number }>()
  private _seenHashes = new Set<string>()
  private _scheduledCleanupTimer: NodeJS.Timeout | undefined = undefined
  private _nextQueueInsertionIndex = 0

  public constructor(private readonly _maxQueueSize: number) {}

  public isReplayedRequest(request: { signatureHash: string; timestamp: number }): boolean {
    const { signatureHash, timestamp: requestTimestamp } = request

    if (this._seenHashes.has(signatureHash)) {
      return true
    }

    this._recordNewRequest({ signatureHash, timestamp: requestTimestamp })
    return false
  }

  private _recordNewRequest(request: { signatureHash: string; timestamp: number }): void {
    this._seenHashes.add(request.signatureHash)
    this._requestQueue.set(this._nextQueueInsertionIndex++, {
      hash: request.signatureHash,
      timestamp: request.timestamp,
    })

    this._scheduleCleanupIfNeeded()
  }

  private _scheduleCleanupIfNeeded(): void {
    if (this._requestQueue.size < this._maxQueueSize || this._scheduledCleanupTimer !== undefined) {
      return
    }

    this._scheduledCleanupTimer = setTimeout(() => this._performCleanup(), 1)
  }

  public [Symbol.dispose](): void {
    if (this._scheduledCleanupTimer !== undefined) {
      clearTimeout(this._scheduledCleanupTimer)
      this._scheduledCleanupTimer = undefined
    }
  }

  private _performCleanup(): void {
    this._removeExpiredEntries()
    this._forceEvictOldestEntries()
    this._scheduledCleanupTimer = undefined
  }

  private _removeExpiredEntries(): void {
    const expiredKeys = this._collectExpiredKeys()

    for (const key of expiredKeys) {
      this._requestQueue.delete(key)
    }
  }

  private _collectExpiredKeys(): number[] {
    const currentTimestamp = Date.now()
    const expiredQueueKeys: number[] = []

    for (const [queueKey, requestEntry] of this._requestQueue) {
      const timestampDifference = Math.abs(currentTimestamp - requestEntry.timestamp)

      if (timestampDifference > SIGNATURE_VALIDATION_WINDOW_MS) {
        expiredQueueKeys.push(queueKey)
        this._seenHashes.delete(requestEntry.hash)
      }
    }

    return expiredQueueKeys
  }

  private _forceEvictOldestEntries(): void {
    if (this._requestQueue.size < this._maxQueueSize) {
      return
    }

    const numberOfEntriesToRemove = this._requestQueue.size - this._maxQueueSize
    this._evictOldestEntries(numberOfEntriesToRemove)
  }

  private _evictOldestEntries(numberOfEntriesToRemove: number): void {
    let entriesRemovedCount = 0

    for (const [queueKey, requestEntry] of this._requestQueue) {
      if (entriesRemovedCount >= numberOfEntriesToRemove) {
        break
      }

      this._requestQueue.delete(queueKey)
      this._seenHashes.delete(requestEntry.hash)
      entriesRemovedCount++
    }
  }
}

/**
 * Creates an in-memory nonce registry for detecting replayed requests.
 *
 * The registry tracks signature hashes to prevent replay attacks by identifying
 * requests that have already been processed. It automatically cleans up expired
 * entries based on the signature validation window and enforces a maximum queue
 * size to prevent unbounded memory growth.
 *
 * @param params - Optional configuration parameters for the registry.
 * @param params.maxSize - The maximum number of entries to store in the registry.
 *   When this limit is exceeded, the oldest entries are evicted during cleanup.
 *   Defaults to 100,000 if not specified.
 *
 * @returns A new {@link InMemoryNonceRegistry} instance that implements
 *   {@link SignatureNonceRegistry} and is disposable via {@link Symbol.dispose}.
 *
 * @example
 * ```typescript
 * // Create a registry with default max size (100,000):
 * using nonceRegistry = createInMemoryNonceRegistry()
 *
 * // Create a registry with custom max size:
 * using nonceRegistry = createInMemoryNonceRegistry({ maxSize: 10_000 })
 *
 * // Use within createSignatureVerifier:
 * const signatureVerifier = createSignatureVerifier({
 *   sharedSecrets: ['my-shared-secret'],
 *   signatureNonceRegistry: nonceRegistry
 * })
 * ```
 */
export const createInMemoryNonceRegistry = (params?: { maxSize?: number }): InMemoryNonceRegistry => {
  const defaultMaxQueueSize = 100_000
  return new InMemoryNonceRegistry(params?.maxSize ?? defaultMaxQueueSize)
}
