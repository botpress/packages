# Botpress Webhook Authentication Library

A TypeScript library for verifying Botpress webhook signatures. This should only be used for self-hosted integrations and bots, since Botpress Cloud handles signature verification automatically.

## Disclaimer ⚠️

> [!IMPORTANT]
> This package is published under the `@bpinternal` organization and is primarily intended for internal use by the [Botpress](https://github.com/botpress/botpress) team. As such, it may have unstable APIs, breaking changes without notice, and limited documentation or support. That said, we've made it public because we love open source! Feel free to use or fork it, but we recommend pinning to specific versions.
>
> — The Botpress Engineering team

## Features

- **HMAC-SHA256 Signature Verification**: Validates signatures against shared secrets
- **Timestamp Validation**: Rejects requests outside a ±5 minute time window
- **Secret Rotation**: Supports multiple secrets for zero-downtime rotation
- **Resource Management**: Automatic cleanup using `Disposable` interface

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

// Verify a webhook request:
const isValid = await verifier.verify({
  headers: req.headers,
  rawBody: req.rawBody,
  method: req.method,
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
  const isValid = await requestVerifier.verify({
    headers: req.headers,
    rawBody: req.rawBody,
    method: req.method,
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
