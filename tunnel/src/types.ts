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

// dummy data to keep the connection alive
export type Hello = z.infer<typeof helloSchema>
export const helloSchema = z.object({ type: z.literal('hello') })

export const tailSchema = z.union([tunnelRequestSchema, helloSchema])
export const headSchema = z.union([tunnelResponseSchema, helloSchema])
