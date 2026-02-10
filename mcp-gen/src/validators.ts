import { z } from '@botpress/sdk'

export const integrationNameSchema = z
  .string()
  .min(1, 'Integration name cannot be empty')
  .max(50, 'Integration name must be 50 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Integration name must contain only lowercase letters, numbers, and hyphens')

export const urlSchema = z
  .string()
  .min(1, 'URL cannot be empty')
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'URL must use http: or https: protocol' }
  )

export const transportTypeSchema = z.enum(['http', 'sse'], {
  errorMap: () => ({ message: 'Transport type must be "http" or "sse"' })
})

export const headerNameSchema = z
  .string()
  .regex(/^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/, 'Invalid header name (RFC 7230)')

export const headerValueSchema = z.string().min(1, 'Header value cannot be empty')

export const headersSchema = z.record(headerNameSchema, headerValueSchema)

export const pathSchema = z.string().min(1, 'Path cannot be empty')

export function validateIntegrationName(name: string): void {
  integrationNameSchema.parse(name)
}

export function validateUrl(url: string): void {
  urlSchema.parse(url)
}

export function validateTransportType(transport: string): asserts transport is 'http' | 'sse' {
  transportTypeSchema.parse(transport)
}

export function parseHeaders(headerArgs: string[] | undefined, savedHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = savedHeaders || {}

  if (headerArgs) {
    for (const header of headerArgs) {
      const colonIndex = header.indexOf(':')
      if (colonIndex <= 0) {
        throw new Error(`Invalid header format: "${header}". Expected "Key: Value"`)
      }

      const key = header.substring(0, colonIndex).trim()
      const value = header.substring(colonIndex + 1).trim()

      headers[key] = value
    }
  }

  return headers
}
