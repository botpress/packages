import {
  SIGNATURE_HASH_BASE64_LENGTH,
  SIGNATURE_HEADER_DELIMITER,
  SIGNATURE_HEADER_MAX_PARTS,
  SIGNATURE_HEADER_MIN_PARTS,
  SIGNATURE_HEADER_NAME,
  SIGNATURE_VALIDATION_WINDOW_MS,
  TIMESTAMP_PAYLOAD_DELIMITER,
} from './constants'

type AnyHeaders = Iterable<[string, unknown]> | Record<string, unknown> | Headers

class RequestSignatureVerifier implements Disposable {
  private readonly _secretBuffers: Uint8Array<ArrayBuffer>[]
  private readonly _cryptoKeys: Promise<CryptoKey>[]
  private readonly _textEncoder = new TextEncoder()

  public constructor(params: { sharedSecrets: string[] }) {
    this._secretBuffers = params.sharedSecrets.map((secret) => this._base64urlToBytes(secret))
    this._cryptoKeys = this._secretBuffers.map(
      async (secretBytes) =>
        await globalThis.crypto.subtle.importKey('raw', secretBytes, { hash: 'SHA-256', name: 'HMAC' }, false, [
          'verify',
        ])
    )
  }

  // oxlint-disable-next-line eslint/complexity
  public async verify(request: { headers: AnyHeaders; method: string; rawBody?: string }): Promise<boolean> {
    if (!this._assertMethodIsPost(request.method) || !this._assertBodyIsNonEmpty(request.rawBody)) {
      return false
    }

    const signatureHeaderValue = this._extractSignatureHeader(this._convertIterableToHeaders(request.headers))
    if (signatureHeaderValue === undefined) {
      return false
    }

    const validationResult = this._validateSignatureFormat(signatureHeaderValue)
    if (!validationResult || !this._isTimestampValid(validationResult.timestamp)) {
      return false
    }

    const payloadToSign = validationResult.timestamp + TIMESTAMP_PAYLOAD_DELIMITER + request.rawBody
    return await this._verifySignaturesWithSecrets({ payloadToSign, receivedHashes: validationResult.receivedHashes })
  }

  private _assertMethodIsPost(method: string): boolean {
    return method.toUpperCase() === 'POST'
  }

  private _assertBodyIsNonEmpty(rawBody: string | undefined): boolean {
    return rawBody !== undefined && rawBody.length > 0
  }

  private _convertIterableToHeaders(headersIterable: AnyHeaders): Headers {
    if (headersIterable instanceof Headers) {
      return headersIterable
    }

    const entries = Symbol.iterator in headersIterable ? [...headersIterable] : Object.entries(headersIterable)

    return new Headers(
      entries.filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
    )
  }

  private _extractSignatureHeader(headers: Headers): string | undefined {
    const headerValue = headers.get(SIGNATURE_HEADER_NAME)
    return headerValue ?? undefined
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

  // oxlint-disable-next-line eslint/complexity
  private async _verifySignaturesWithSecrets(params: {
    receivedHashes: string[]
    payloadToSign: string
  }): Promise<boolean> {
    for (let secretIndex = 0; secretIndex < this._secretBuffers.length; secretIndex++) {
      for (const receivedHash of params.receivedHashes) {
        // oxlint-disable-next-line no-await-in-loop
        const isValid = await this._verifyHmac({
          expectedHash: receivedHash,
          payload: params.payloadToSign,
          secretIndex,
        })

        if (isValid) {
          return true
        }
      }
    }

    return false
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
    // No resources to dispose
  }
}

/**
 * Creates a signature verifier for validating Botpress webhook requests in
 * self-hosted bots and integrations.
 *
 * The verifier validates HMAC-SHA256 signatures against one or more shared
 * secrets, rejects requests outside a ±5 minute time window, supports
 * zero-downtime secret rotation with multiple secrets, and implements
 * `Disposable` for automatic cleanup with `using` declarations.
 *
 * ## Basic Usage
 *
 * ```typescript
 * using verifier = createSignatureVerifier({
 *   sharedSecrets: ['your-secret']
 * })
 *
 * const isValid = await verifier.verify({
 *   headers: req.headers,
 *   rawBody: req.rawBody,
 *   method: req.method
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
 *     headers: req.headers,
 *     rawBody: req.rawBody, // Must be raw bytes, not parsed
 *     method: req.method
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
export const createSignatureVerifier = (params: { sharedSecrets: string[] }): RequestSignatureVerifier =>
  new RequestSignatureVerifier(params)
