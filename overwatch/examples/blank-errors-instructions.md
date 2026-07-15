# Replacing raw `Error` with typed `ServiceError`s

## Why

A raw `throw new Error('...')` reaches the tRPC error boundary as an **unknown** error, so
`trpc/error-handling.ts` maps it to a generic **`500 INTERNAL_SERVER_ERROR`**. The client
can't tell "you asked for something that doesn't exist" (404) apart from "the server broke"
(500), and we log a real bug for what was actually an expected, user-caused outcome.

Throwing a `ServiceError` subclass instead lets the centralized middleware translate it to the
right HTTP/tRPC code, keeps services tRPC-agnostic, and keeps logs honest.

> Never introduce `new TRPCError(...)` in app code either — same rule, same reason.

## The error classes (`services/errors.ts`)

| Class | Maps to | Constructor | Use when |
| --- | --- | --- | --- |
| `NotFoundError` | 404 | `(resource: ResourceType, id?)` | The thing they asked for doesn't exist (or they can't see it) |
| `ForbiddenError` | 403 | `(message?)` | Authenticated, but not allowed to do this |
| `ValidationError` | 400 | `(message)` | The **input shape** is wrong / nonsensical |
| `BusinessRuleError` | 422 | `(message)` | Input is well-formed but the **current state** forbids it |
| `ConflictError` | 409 | `(resource, identifier)` | The thing already exists |
| `ConcurrentOperationError` | 409 | `(message)` | A competing operation is in flight (lock held) |
| `RequiredFieldsError` | 412 | `(missingFields: {fieldDefinitionId,name}[])` | Preconditions (required fields) unmet |

## How to migrate one throw

1. **Read the message** you're throwing and ask *what does the caller need to know?* — that
   picks the class from the table above.
2. **Swap the constructor.** Drop the raw string into the closest-fit subclass.
3. For `NotFoundError`, pass a **`ResourceType`** (the union in `errors.ts`) and, when you have
   it, the id. If your resource isn't in the union yet, add it there first.
4. **Import** the class from the errors module (`services/errors.ts`) — remove the raw throw.
5. **Don't** wrap it in `try/catch` just to re-throw as a `TRPCError`; the middleware already
   maps `ServiceError`s. And don't string-match an upstream message to pick a code — fix the
   upstream throw instead.

---

## Before / after (fake `orders`/`billing` domain)

### 404 — resource missing → `NotFoundError`

```ts
// ❌ before
const order = await orderRepo.getById(orderId)
if (!order) {
  throw new Error('Order not found')
}

// ✅ after
const order = await orderRepo.getById(orderId)
if (!order) {
  throw new NotFoundError('Order', orderId)
}
```

### 403 — not allowed → `ForbiddenError`

```ts
// ❌ before
if (order.merchantId !== ctx.merchantId) {
  throw new Error('You cannot refund another merchant\'s order')
}

// ✅ after
if (order.merchantId !== ctx.merchantId) {
  throw new ForbiddenError('You cannot refund an order that belongs to another merchant')
}
```

### 400 — malformed input → `ValidationError`

```ts
// ❌ before
if (input.discountPercent < 0 || input.discountPercent > 100) {
  throw new Error('discountPercent must be between 0 and 100')
}

// ✅ after
if (input.discountPercent < 0 || input.discountPercent > 100) {
  throw new ValidationError('discountPercent must be between 0 and 100')
}
```

### 422 — valid input, wrong state → `BusinessRuleError`

```ts
// ❌ before
if (order.status === 'shipped') {
  throw new Error('Cannot cancel an order that has already shipped')
}

// ✅ after
if (order.status === 'shipped') {
  throw new BusinessRuleError('Cannot cancel an order that has already shipped')
}
```

`ValidationError` vs `BusinessRuleError`: if the request could *never* be valid (bad shape,
out-of-range number, wrong enum) it's a `ValidationError` (400). If the request is fine but the
world isn't in a state that allows it (already shipped, already refunded, subscription paused)
it's a `BusinessRuleError` (422).

### 409 — already exists → `ConflictError`

```ts
// ❌ before
const existing = await couponRepo.findByCode(input.code)
if (existing) {
  throw new Error(`Coupon ${input.code} already exists`)
}

// ✅ after — ConflictError builds the message: "Coupon with code 'SUMMER10' already exists"
const existing = await couponRepo.findByCode(input.code)
if (existing) {
  throw new ConflictError('Coupon', `code '${input.code}'`)
}
```

### 409 — lock held → `ConcurrentOperationError`

```ts
// ❌ before
if (!acquired) {
  throw new Error('Another payout is already running for this merchant')
}

// ✅ after
if (!acquired) {
  throw new ConcurrentOperationError('A payout is already running for this merchant')
}
```

### 412 — preconditions unmet → `RequiredFieldsError`

```ts
// ❌ before
if (missing.length > 0) {
  throw new Error('Missing required checkout fields: ' + missing.map((f) => f.name).join(', '))
}

// ✅ after — carries the structured list so the UI can highlight each field
if (missing.length > 0) {
  throw new RequiredFieldsError(
    missing.map((f) => ({ fieldDefinitionId: f.id, name: f.name }))
  )
}
```

---

## Gotchas

- **`NotFoundError` needs a `ResourceType`**, not a free string. `throw new NotFoundError('Cart')`
  only compiles if `'Cart'` is in the `ResourceType` union — add it to `errors.ts` if missing.
- **Don't log-and-rethrow at the throw site.** Log once at the boundary that handles it; a 404
  from a user typo is not a `console.error`.
- **A real bug stays a real `Error`.** If a branch is genuinely "this should be impossible",
  a thrown `Error` (→ 500) is correct — the goal is to stop mislabeling *expected* outcomes as
  500s, not to wrap every throw.
- **Internal errors must NOT extend `ServiceError`.** `ServiceError` (and its subclasses) is the
  contract for *expected, user-facing* outcomes that map to a 4xx and whose message is safe to
  return to the client. An internal failure — a violated invariant, a failed DB write, a
  misconfiguration, a "this can't happen" branch — is a **bug**, so it must surface as a
  `500` and get logged/alerted. Throw a plain `Error` (or a custom class that extends `Error`,
  not `ServiceError`) for these. If you extend `ServiceError` for an internal error you'll hide
  a real bug behind a 4xx, leak internal details in the response message, and silence the alert.

  ```ts
  // ❌ internal failure dressed up as a mapped 4xx — hides the bug, leaks internals
  export class PaymentGatewayError extends BusinessRuleError {}
  throw new PaymentGatewayError(`Stripe returned ${resp.status}: ${resp.body}`)

  // ✅ internal failure stays a 500, gets logged/alerted
  export class PaymentGatewayError extends Error {}
  throw new PaymentGatewayError(`Stripe charge failed: ${resp.status}`)
  ```
- **Services throw, routers don't map.** Put the `ServiceError` throw in the service/repository
  layer where the rule is evaluated; the router just calls it and lets the middleware translate.

