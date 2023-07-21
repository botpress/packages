import { z } from 'zod'

export type TunnelHeader = z.infer<typeof tunnelHeaderSchema>
export const tunnelHeaderSchema = z.union([z.undefined(), z.string(), z.string().array()])

export type TunnelRequest = z.infer<typeof tunnelRequestSchema>
export const tunnelRequestSchema = z.object({
  id: z.string(),
  method: z.string(),
  path: z.string(),
  query: z.string().optional(),
  headers: z.record(tunnelHeaderSchema).optional(),
  body: z.string().optional()
})

export type TunnelResponse = z.infer<typeof tunnelResponseSchema>
export const tunnelResponseSchema = z.object({
  requestId: z.string(),
  status: z.number(),
  headers: z.record(tunnelHeaderSchema).optional(),
  body: z.string().optional()
})

export type Ping = z.infer<typeof pingSchema>
export const pingSchema = z.object({ type: z.literal('ping') })

export type Pong = z.infer<typeof pongSchema>
export const pongSchema = z.object({ type: z.literal('pong') })
