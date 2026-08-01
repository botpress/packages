import { z } from 'zod'

export type TunnelHeader = z.infer<typeof tunnelHeaderSchema>
export const tunnelHeaderSchema = z.union([z.undefined(), z.string(), z.string().array()])

export type TunnelRequest = z.infer<typeof tunnelRequestSchema>
export const tunnelRequestSchema = z.object({
  type: z.literal('request').optional(), // optional for backwards compatibility
  id: z.string(),
  method: z.string(),
  path: z.string(),
  query: z.string().optional(),
  headers: z.record(tunnelHeaderSchema).optional(),
  body: z.string().optional()
})

export type TunnelResponse = z.infer<typeof tunnelResponseSchema>
export const tunnelResponseSchema = z.object({
  type: z.literal('response').optional(), // optional for backwards compatibility
  requestId: z.string(),
  status: z.number(),
  headers: z.record(tunnelHeaderSchema).optional(),
  body: z.string().optional()
})

// dummy data to keep the connection alive; `capabilities` advertises optional
// protocol extensions (a head only sends ws_* frames to a tail that said 'ws',
// so a pre-websocket tail never receives frames it cannot parse)
export type Hello = z.infer<typeof helloSchema>
export const helloSchema = z.object({
  type: z.literal('hello'),
  capabilities: z.string().array().optional()
})

export const WS_CAPABILITY = 'ws'

/**
 * WebSocket bridging: a public visitor's socket terminated at the tunnel
 * server is multiplexed over the tunnel connection frame-by-frame, keyed by a
 * per-socket `id`. head → tail: ws_open / ws_frame / ws_close.
 * tail → head: ws_accept | ws_reject (answer to ws_open) / ws_frame / ws_close.
 */
export type TunnelWsOpen = z.infer<typeof tunnelWsOpenSchema>
export const tunnelWsOpenSchema = z.object({
  type: z.literal('ws_open'),
  id: z.string(),
  path: z.string(),
  query: z.string().optional(),
  headers: z.record(tunnelHeaderSchema).optional()
})

export type TunnelWsAccept = z.infer<typeof tunnelWsAcceptSchema>
export const tunnelWsAcceptSchema = z.object({
  type: z.literal('ws_accept'),
  id: z.string(),
  subprotocol: z.string().optional()
})

export type TunnelWsReject = z.infer<typeof tunnelWsRejectSchema>
export const tunnelWsRejectSchema = z.object({
  type: z.literal('ws_reject'),
  id: z.string(),
  reason: z.string().optional()
})

export type TunnelWsFrame = z.infer<typeof tunnelWsFrameSchema>
export const tunnelWsFrameSchema = z.object({
  type: z.literal('ws_frame'),
  id: z.string(),
  /** utf-8 text, or base64 when `binary` is true */
  data: z.string(),
  binary: z.boolean().optional()
})

export type TunnelWsClose = z.infer<typeof tunnelWsCloseSchema>
export const tunnelWsCloseSchema = z.object({
  type: z.literal('ws_close'),
  id: z.string(),
  code: z.number().optional(),
  reason: z.string().optional()
})

export const tailSchema = z.union([
  tunnelRequestSchema,
  helloSchema,
  tunnelWsOpenSchema,
  tunnelWsFrameSchema,
  tunnelWsCloseSchema
])
export const headSchema = z.union([
  tunnelResponseSchema,
  helloSchema,
  tunnelWsAcceptSchema,
  tunnelWsRejectSchema,
  tunnelWsFrameSchema,
  tunnelWsCloseSchema
])
