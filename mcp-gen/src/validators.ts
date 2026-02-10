import * as path from 'path'
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

export const pathSchema = z
  .string()
  .min(1, 'Path cannot be empty')
  .refine(
    (outputPath) => {
      const normalized = path.normalize(outputPath)
      const absolutePath = path.resolve(normalized)
      return !normalized.includes('..') || absolutePath.startsWith(process.cwd())
    },
    { message: 'Path traversal detected' }
  )

export function validateIntegrationName(name: string): void {
  integrationNameSchema.parse(name)
}

export function validateUrl(url: string): void {
  urlSchema.parse(url)
}

export function validatePath(outputPath: string): void {
  pathSchema.parse(outputPath)
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

      headerNameSchema.parse(key)
      headerValueSchema.parse(value)

      headers[key] = value
    }
  }

  return headers
}

export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    const cleanValue = value.replace(/[\x00-\x1F\x7F]/g, '')

    const keyResult = headerNameSchema.safeParse(key)
    const valueResult = headerValueSchema.safeParse(cleanValue)

    if (keyResult.success && valueResult.success) {
      sanitized[key] = cleanValue
    } else {
      console.warn(`Skipping invalid header: ${key}`)
    }
  }

  return sanitized
}
