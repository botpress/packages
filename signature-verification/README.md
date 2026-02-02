# Signature Verification Library

A TypeScript library for verifying Botpress webhook signatures with built-in replay protection. This should only be used for self-hosted integrations and bots, since Botpress Cloud handles signature verification automatically.

## Features

- **HMAC-SHA256 Signature Verification**: Validates signatures against shared secrets
- **Timestamp Validation**: Rejects requests outside a ±5 minute time window
- **Replay Protection**: Prevents signature reuse with pluggable nonce registries
- **Secret Rotation**: Supports multiple secrets for zero-downtime rotation
- **Resource Management**: Automatic cleanup using `Disposable` interface
- **Distributed Systems**: Supports Redis-backed registry for multi-instance deployments

## Installation

```bash
npm install --save @bpinternal/signature-verification
```

## Quick Start

```typescript
import { createSignatureVerifier } from '@bpinternal/signature-verification'

// Create a verifier with your shared secret:
using verifier = createSignatureVerifier({
  sharedSecrets: [process.env.WEBHOOK_SECRET],
})

// Verify a webhook signature:
const isValid = await verifier.verify({
  rawRequestBody: '{"event":"action_called"}',
  signatureHeaderValue: '1234567890,abc123...',
})

if (!isValid) {
  throw new Error('Invalid signature')
}

// Else, process the webhook...
```

## Usage

### Secret Rotation (Zero-Downtime)

Support multiple secrets to enable gradual rotation:

```typescript
using verifier = createSignatureVerifier({
  sharedSecrets: [
    process.env.OLD_SECRET, // Still accepting old signatures
    process.env.NEW_SECRET, // Now also accepting new signatures
  ],
})
```

Secrets are tried in order until a match is found.

### Distributed Systems (Redis)

For multi-instance deployments, use a Redis-backed nonce registry:

```typescript
import { createRedisNonceRegistry } from '@bpinternal/signature-verification'
import Redis from 'ioredis'

const redisClient = new Redis({ ... })

using signatureNonceRegistry = createRedisNonceRegistry({
  client: redisClient,
  failOpen: true // Allow requests if Redis is unavailable
})

using verifier = createSignatureVerifier({
  sharedSecrets: [process.env.WEBHOOK_SECRET],
  signatureNonceRegistry
})
```

### Express Middleware Example

```typescript
import express from 'express'
import { createSignatureVerifier } from '@bpinternal/signature-verification'

const app = express()

// IMPORTANT: Capture raw body before parsing
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8')
    },
  })
)

using requestVerifier = createSignatureVerifier({
  sharedSecrets: [process.env.WEBHOOK_SECRET],
})

// Create a reusable middleware:
const verifySignature = async (req, res, next) => {
  const signature = req.headers['x-bp-signature']

  if (!signature || typeof signature !== 'string' || !req.rawBody) {
    return res.status(400).json({ error: 'Missing signature or body' })
  }

  const isValid = await requestVerifier.verify({
    rawRequestBody: req.rawBody,
    signatureHeaderValue: signature,
  })

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  next()
}

// Use the middleware in your routes:
app.post('/webhook', verifySignature, (req, res) => {
  // Process webhook...
  res.status(200).json({ message: 'Webhook received' })
})
```
