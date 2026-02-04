import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import express, { type Express } from 'express'
import { createSignatureVerifier } from '../request-signature-verifier'

type Server = ReturnType<Express['listen']>

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

const _createTestApp = (secret: string): Express => {
  const app = express()

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        ;(req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8')
      },
    })
  )

  const verifier = createSignatureVerifier({
    sharedSecrets: [secret],
  })

  const _verifySignature: express.RequestHandler = async (req, res, next) => {
    const signature = req.headers['x-bp-signature']
    const { rawBody } = req as express.Request & { rawBody?: string }

    if (signature === undefined || typeof signature !== 'string' || rawBody === undefined) {
      res.status(400).json({ error: 'Missing signature or body' })
      return
    }

    const isValid = await verifier.verify({
      rawRequestBody: rawBody,
      signatureHeaderValue: signature,
    })

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    next()
  }

  app.post('/webhook', _verifySignature, (req, res) => {
    res.status(200).json({ data: req.body as string, message: 'Webhook received' })
  })

  return app
}

describe('Express middleware integration', () => {
  let app: Express
  let server: Server
  let baseUrl: string
  let secret: string

  beforeAll(async () => {
    secret = _generateBase64UrlSecret()
    app = _createTestApp(secret)

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address()
        if (address !== undefined && address !== null && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}`
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  })

  it('should accept request with valid signature', async () => {
    // Arrange
    const body = { event: 'user.created', userId: 123 }
    const rawBody = JSON.stringify(body)
    const timestamp = Date.now()
    const payload = `${timestamp}.${rawBody}`
    const hash = await _computeHmac({ payload, secret })
    const signature = `${timestamp},${hash}`

    // Act
    const response = await fetch(`${baseUrl}/webhook`, {
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
        'X-BP-Signature': signature,
      },
      method: 'POST',
    })

    // Assert
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ data: body, message: 'Webhook received' })
  })

  it('should reject request with invalid signature', async () => {
    // Arrange
    const body = { event: 'user.created', userId: 123 }
    const rawBody = JSON.stringify(body)
    const timestamp = Date.now()
    const invalidHash = _generateBase64UrlSecret().slice(0, 43)
    const signature = `${timestamp},${invalidHash}`

    // Act
    const response = await fetch(`${baseUrl}/webhook`, {
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
        'X-BP-Signature': signature,
      },
      method: 'POST',
    })

    // Assert
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' })
  })

  it('should reject request with expired timestamp', async () => {
    // Arrange
    const body = { event: 'user.created', userId: 123 }
    const rawBody = JSON.stringify(body)
    const oldTimestamp = Date.now() - 10 * 60 * 1000
    const payload = `${oldTimestamp}.${rawBody}`
    const hash = await _computeHmac({ payload, secret })
    const signature = `${oldTimestamp},${hash}`

    // Act
    const response = await fetch(`${baseUrl}/webhook`, {
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
        'X-BP-Signature': signature,
      },
      method: 'POST',
    })

    // Assert
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' })
  })

  it('should prevent replay attacks', async () => {
    // Arrange
    const body = { event: 'user.created', userId: 456 }
    const rawBody = JSON.stringify(body)
    const timestamp = Date.now()
    const payload = `${timestamp}.${rawBody}`
    const hash = await _computeHmac({ payload, secret })
    const signature = `${timestamp},${hash}`

    // Act
    const response1 = await fetch(`${baseUrl}/webhook`, {
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
        'X-BP-Signature': signature,
      },
      method: 'POST',
    })

    const response2 = await fetch(`${baseUrl}/webhook`, {
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
        'X-BP-Signature': signature,
      },
      method: 'POST',
    })

    // Assert
    expect(response1.status).toBe(200)
    expect(response2.status).toBe(401)
    await expect(response2.json()).resolves.toEqual({ error: 'Invalid signature' })
  })

  it('should reject request without signature header', async () => {
    // Arrange
    const body = { event: 'user.created', userId: 789 }
    const rawBody = JSON.stringify(body)

    // Act
    const response = await fetch(`${baseUrl}/webhook`, {
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    // Assert
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Missing signature or body' })
  })
})
