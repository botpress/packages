import type { SignatureNonceRegistry } from './types'
import {
  SIGNATURE_HASH_BASE64_LENGTH,
  SIGNATURE_HEADER_DELIMITER,
  SIGNATURE_HEADER_MAX_PARTS,
  SIGNATURE_HEADER_MIN_PARTS,
  SIGNATURE_VALIDATION_WINDOW_MS,
  TIMESTAMP_PAYLOAD_DELIMITER,
} from './constants'
import { createInMemoryNonceRegistry } from './in-memory-nonce-registry'

class RequestSignatureVerifier implements Disposable {
  private readonly _secretBuffers: Uint8Array<ArrayBuffer>[]
  private readonly _signatureNonceRegistry?: SignatureNonceRegistry
  private readonly _cryptoKeys: Promise<CryptoKey>[]
  private readonly _textEncoder = new TextEncoder()

  public constructor(params: { sharedSecrets: string[]; signatureNonceRegistry?: SignatureNonceRegistry }) {
    this._secretBuffers = params.sharedSecrets.map((secret) => this._base64urlToBytes(secret))
    this._signatureNonceRegistry = params.signatureNonceRegistry
    this._cryptoKeys = this._secretBuffers.map(
      async (secretBytes) =>
        await globalThis.crypto.subtle.importKey('raw', secretBytes, { hash: 'SHA-256', name: 'HMAC' }, false, [
          'verify',
        ])
    )
  }

  public async verify({
    rawRequestBody,
    signatureHeaderValue,
  }: {
    rawRequestBody: string
    signatureHeaderValue: string
  }): Promise<boolean> {
    const validationResult = this._validateSignatureFormat(signatureHeaderValue)
    if (!validationResult) {
      return false
    }

    const { timestamp, receivedHashes } = validationResult

    if (!this._isTimestampValid(timestamp)) {
      return false
    }

    const payloadToSign = timestamp + TIMESTAMP_PAYLOAD_DELIMITER + rawRequestBody

    return await this._verifySignaturesWithSecrets({ payloadToSign, receivedHashes, timestamp })
  }

  private _validateSignatureFormat(
    signatureHeaderValue: string
  ): { timestamp: number; receivedHashes: string[] } | undefined {
    const parts = signatureHeaderValue.split(SIGNATURE_HEADER_DELIMITER, SIGNATURE_HEADER_MAX_PARTS + 1)

    if (!this._isValidPartCount(parts)) {
      return undefined
    }

    return this._parseSignatureParts(parts)
  }

  private _isValidPartCount(parts: string[]): boolean {
    return parts.length >= SIGNATURE_HEADER_MIN_PARTS && parts.length <= SIGNATURE_HEADER_MAX_PARTS
  }

  private _parseSignatureParts(parts: string[]): { timestamp: number; receivedHashes: string[] } | undefined {
    const [timestampStr, ...receivedHashes] = parts
    const timestamp = Number(timestampStr)

    if (!this._areSignaturePartsValid({ receivedHashes, timestamp })) {
      return undefined
    }

    return { receivedHashes, timestamp }
  }

  private _areSignaturePartsValid(params: { receivedHashes: string[]; timestamp: number }): boolean {
    if (!params.timestamp || params.receivedHashes.length === 0) {
      return false
    }

    return this._areHashesValidLength(params.receivedHashes)
  }

  private _areHashesValidLength(hashes: string[]): boolean {
    return hashes.every((hash) => hash.length === SIGNATURE_HASH_BASE64_LENGTH)
  }

  private _isTimestampValid(timestamp: number): boolean {
    const now = Date.now()
    return Math.abs(now - timestamp) <= SIGNATURE_VALIDATION_WINDOW_MS
  }

  private async _verifySignaturesWithSecrets(params: {
    receivedHashes: string[]
    payloadToSign: string
    timestamp: number
  }): Promise<boolean> {
    return await this._verifyWithSecretIndex({
      ...params,
      secretIndex: 0,
    })
  }

  private async _verifyWithSecretIndex(params: {
    secretIndex: number
    receivedHashes: string[]
    payloadToSign: string
    timestamp: number
  }): Promise<boolean> {
    const { secretIndex, receivedHashes, payloadToSign, timestamp } = params

    if (secretIndex >= this._secretBuffers.length) {
      return false
    }

    const result = await this._verifySignaturesWithSecret({
      payloadToSign,
      receivedHashes,
      secretIndex,
      timestamp,
    })

    if (result) {
      return true
    }

    return await this._verifyWithSecretIndex({
      ...params,
      secretIndex: secretIndex + 1,
    })
  }

  private async _verifySignaturesWithSecret(params: {
    secretIndex: number
    receivedHashes: string[]
    payloadToSign: string
    timestamp: number
  }): Promise<boolean> {
    return await this._verifyHashAtIndex({
      ...params,
      hashIndex: 0,
    })
  }

  private async _verifyHashAtIndex(params: {
    hashIndex: number
    secretIndex: number
    receivedHashes: string[]
    payloadToSign: string
    timestamp: number
  }): Promise<boolean> {
    const { hashIndex, secretIndex, receivedHashes, payloadToSign, timestamp } = params

    const receivedHash = this._getHashAtIndex({ hashIndex, receivedHashes })
    if (receivedHash === undefined) {
      return false
    }

    const isValid = await this._verifyHmac({ expectedHash: receivedHash, payload: payloadToSign, secretIndex })

    if (isValid) {
      return await this._checkReplayProtection({ receivedHash, timestamp })
    }

    return await this._verifyHashAtIndex({
      ...params,
      hashIndex: hashIndex + 1,
    })
  }

  private _getHashAtIndex(params: { hashIndex: number; receivedHashes: string[] }): string | undefined {
    if (params.hashIndex >= params.receivedHashes.length) {
      return undefined
    }

    return params.receivedHashes[params.hashIndex]
  }

  private async _checkReplayProtection(params: { receivedHash: string; timestamp: number }): Promise<boolean> {
    if (!this._signatureNonceRegistry) {
      return true
    }

    const isReplayed = await this._signatureNonceRegistry.isReplayedRequest({
      signatureHash: params.receivedHash,
      timestamp: params.timestamp,
    })
    return !isReplayed
  }

  private async _verifyHmac(params: { secretIndex: number; payload: string; expectedHash: string }): Promise<boolean> {
    const { secretIndex, payload, expectedHash } = params

    const cryptoKeyPromise = this._cryptoKeys[secretIndex]
    if (cryptoKeyPromise === undefined) {
      return false
    }

    const cryptoKey = await cryptoKeyPromise
    const payloadBytes = this._textEncoder.encode(payload)
    const signatureBytes = this._base64urlToBytes(expectedHash)

    try {
      return await globalThis.crypto.subtle.verify('HMAC', cryptoKey, signatureBytes, payloadBytes)
    } catch {
      return false
    }
  }

  private _base64urlToBytes(base64url: string): Uint8Array<ArrayBuffer> {
    const base64 = base64url.replaceAll('-', '+').replaceAll('_', '/')
    const paddingLength = 4
    const padding = '='.repeat((paddingLength - (base64.length % paddingLength)) % paddingLength)
    const padded = base64 + padding
    const binary = atob(padded)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.codePointAt(index) ?? 0
    }
    return bytes
  }

  public [Symbol.dispose](): void {
    this._signatureNonceRegistry?.[Symbol.dispose]()
  }
}

/**
 * Creates a signature verifier for validating Botpress webhook requests in
 * self-hosted bots and integrations.
 *
 * The verifier validates HMAC-SHA256 signatures against one or more shared
 * secrets, rejects requests outside a ±5 minute time window, prevents replay
 * attacks using a nonce registry (in-memory by default), supports zero-downtime
 * secret rotation with multiple secrets, and implements `Disposable` for
 * automatic cleanup with `using` declarations.
 *
 * ## Basic Usage (with default in-memory registry)
 *
 * ```typescript
 * using verifier = createSignatureVerifier({
 *   sharedSecrets: ['your-secret']
 * })
 *
 * const isValid = await verifier.verify({
 *   rawRequestBody,
 *   signatureHeaderValue
 * })
 * ```
 *
 * ## With Redis-backed Nonce Registry (for distributed systems)
 *
 * ```typescript
 * using nonceRegistry = createRedisNonceRegistry({
 *   client: redisClient,
 *   failOpen: true
 * })
 *
 * using verifier = createSignatureVerifier({
 *   sharedSecrets: ['your-secret'],
 *   signatureNonceRegistry: nonceRegistry
 * })
 * ```
 *
 * ## Secret Rotation
 *
 * ```typescript
 * // Include both old and new secrets during rotation period:
 * using verifier = createSignatureVerifier({
 *   sharedSecrets: ['old-secret', 'new-secret']
 * })
 * ```
 *
 * ## Important Notes
 *
 * - Always use `using` declarations. The verifier implements `Disposable` and
 *   must be properly disposed.
 * - Ensure your server clock is synchronized (use NTP) to avoid rejecting valid
 *   signatures due to clock skew. The verifier has a ±5 minute tolerance
 *   window, but if your clock is significantly off, valid requests may be
 *   rejected.
 * - The body must be the exact raw bytes received, not parsed JSON.
 *
 * @param params - Configuration for the signature verifier
 * @param params.sharedSecrets - Array of shared secrets for signature verification. Secrets are tried in order.
 * @param params.signatureNonceRegistry - Optional nonce registry for replay protection.
 *   Defaults to an in-memory registry with 100,000 max entries. Use a Redis-backed registry
 *   for distributed systems.
 *
 * @returns A disposable signature verifier instance.
 *
 * @example
 * ```typescript
 * using verifier = createSignatureVerifier({
 *   sharedSecrets: [process.env.BOTPRESS_WEBHOOK_SECRET]
 * })
 *
 * app.post('/webhook', async (req, res) => {
 *   const isValid = await verifier.verify({
 *     rawRequestBody: req.rawBody, // Must be raw bytes, not parsed
 *     signatureHeaderValue: req.headers['X-BP-Signature']
 *   })
 *
 *   if (!isValid) {
 *     return res.status(401).send('Invalid signature')
 *   }
 *
 *   // (Process webhook request)
 * })
 * ```
 */
export const createSignatureVerifier = (params: {
  sharedSecrets: string[]
  signatureNonceRegistry?: SignatureNonceRegistry
}): RequestSignatureVerifier => {
  const signatureNonceRegistry = params.signatureNonceRegistry ?? createInMemoryNonceRegistry()

  return new RequestSignatureVerifier({ ...params, signatureNonceRegistry })
}
