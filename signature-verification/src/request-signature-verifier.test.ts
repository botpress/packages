import { describe, expect, it } from 'vitest'
import { createSignatureVerifier } from './request-signature-verifier'

const _generateBase64UrlSecret = (): string => {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32))
  const binary = String.fromCodePoint(...bytes)
  const base64 = btoa(binary)
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

const _computeHmac = async (params: { secret: string; payload: string }): Promise<string> => {
  const secretBytes = _base64urlToBytes(params.secret)
  const key = await globalThis.crypto.subtle.importKey('raw', secretBytes, { hash: 'SHA-256', name: 'HMAC' }, false, [
    'sign',
  ])
  const payloadBytes = new TextEncoder().encode(params.payload)
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, payloadBytes)
  return _bytesToBase64url(new Uint8Array(signature))
}

const _base64urlToBytes = (base64url: string): Uint8Array<ArrayBuffer> => {
  const base64 = base64url.replaceAll('-', '+').replaceAll('_', '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const padded = base64 + padding
  const binary = atob(padded)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.codePointAt(index) ?? 0
  }
  return bytes
}

const _bytesToBase64url = (bytes: Uint8Array): string => {
  const binary = String.fromCodePoint(...bytes)
  const base64 = btoa(binary)
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

describe.concurrent(createSignatureVerifier, () => {
  const _getMocks = () => {
    const secret = _generateBase64UrlSecret()
    const rawRequestBody = '{"event":"user.created","userId":123}'
    const timestamp = Date.now()
    return { rawRequestBody, secret, timestamp }
  }

  describe.concurrent('valid signature verification', () => {
    it('should verify a valid signature with single secret', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const payload = `${timestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${timestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeTruthy()
    })

    it('should verify with multiple secrets when signature matches first secret', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const secret2 = _generateBase64UrlSecret()
      const payload = `${timestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${timestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret, secret2] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeTruthy()
    })

    it('should verify with multiple secrets when signature matches second secret', async () => {
      const { rawRequestBody, timestamp } = _getMocks()
      const secret1 = _generateBase64UrlSecret()
      const secret2 = _generateBase64UrlSecret()
      const payload = `${timestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret: secret2 })
      const signatureHeaderValue = `${timestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret1, secret2] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeTruthy()
    })

    it('should verify with multiple hashes in signature header', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const payload = `${timestamp}.${rawRequestBody}`
      const hash1 = await _computeHmac({ payload, secret })
      const hash2 = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${timestamp},${hash1},${hash2}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeTruthy()
    })
  })

  describe.concurrent('invalid signature verification', () => {
    it('should reject signature with wrong hash', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const wrongHash = _generateBase64UrlSecret().slice(0, 43)
      const signatureHeaderValue = `${timestamp},${wrongHash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should reject signature with wrong secret', async () => {
      const { rawRequestBody, timestamp } = _getMocks()
      const correctSecret = _generateBase64UrlSecret()
      const wrongSecret = _generateBase64UrlSecret()
      const payload = `${timestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret: wrongSecret })
      const signatureHeaderValue = `${timestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [correctSecret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should reject signature with modified body', async () => {
      const { secret, timestamp } = _getMocks()
      const originalBody = '{"event":"user.created"}'
      const modifiedBody = '{"event":"user.deleted"}'
      const payload = `${timestamp}.${originalBody}`
      const hash = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${timestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody: modifiedBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should return false when crypto verification throws error', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const hashWithInvalidBase64 = '===========AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      const signatureHeaderValue = `${timestamp},${hashWithInvalidBase64}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })
  })

  describe.concurrent('signature format validation', () => {
    it('should reject signature with too few parts', async () => {
      const { secret, rawRequestBody } = _getMocks()
      const signatureHeaderValue = `${Date.now()}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should reject signature with too many hashes', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const hash = _generateBase64UrlSecret().slice(0, 43)
      const signatureHeaderValue = `${timestamp},${hash},${hash},${hash},${hash},${hash},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should reject signature with invalid hash length', async () => {
      const { secret, rawRequestBody, timestamp } = _getMocks()
      const invalidHash = 'too_short'
      const signatureHeaderValue = `${timestamp},${invalidHash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should reject signature with invalid timestamp', async () => {
      const { secret, rawRequestBody } = _getMocks()
      const hash = _generateBase64UrlSecret().slice(0, 43)
      const signatureHeaderValue = `invalid,${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })
  })

  describe.concurrent('timestamp validation', () => {
    it('should reject signature with timestamp too far in past', async () => {
      const { secret, rawRequestBody } = _getMocks()
      const oldTimestamp = Date.now() - 10 * 60 * 1000
      const payload = `${oldTimestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${oldTimestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should reject signature with timestamp too far in future', async () => {
      const { secret, rawRequestBody } = _getMocks()
      const futureTimestamp = Date.now() + 10 * 60 * 1000
      const payload = `${futureTimestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${futureTimestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeFalsy()
    })

    it('should accept signature within valid time window', async () => {
      const { secret, rawRequestBody } = _getMocks()
      const timestamp = Date.now() - 2 * 60 * 1000
      const payload = `${timestamp}.${rawRequestBody}`
      const hash = await _computeHmac({ payload, secret })
      const signatureHeaderValue = `${timestamp},${hash}`

      using verifier = createSignatureVerifier({ sharedSecrets: [secret] })
      const result = await verifier.verify({ rawRequestBody, signatureHeaderValue })

      expect(result).toBeTruthy()
    })
  })
})
