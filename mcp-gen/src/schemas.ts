import { z } from '@botpress/sdk'

export const transportTypeSchema = z.enum(['http', 'sse'], {
  errorMap: () => ({ message: 'Transport type must be "http" or "sse"' })
})

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

export const headerNameSchema = z.string().regex(/^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/, 'Invalid header name (RFC 7230)')
export const headerValueSchema = z.string().min(1, 'Header value cannot be empty')
export const headersSchema = z.record(headerNameSchema, headerValueSchema)

export const integrationNameSchema = z
  .string()
  .min(1, 'Integration name cannot be empty')
  .max(50, 'Integration name must be 50 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Integration name must contain only lowercase letters, numbers, and hyphens')

export const pathSchema = z.string().min(1, 'Path cannot be empty')

export const mcpServerConfigSchema = z.object({
  name: integrationNameSchema,
  url: urlSchema,
  type: transportTypeSchema,
  headers: headersSchema.optional()
})

export const generatorOptionsSchema = z.object({
  integrationName: integrationNameSchema,
  mcpServerUrl: urlSchema,
  outputDir: pathSchema,
  transport: transportTypeSchema.optional(),
  headers: headersSchema.optional(),
  updateMode: z.boolean().optional(),
  saveConfig: z.boolean().optional(),
  configFilename: z.string().optional()
})

export const configManagerOptionsSchema = z.object({
  configFilename: z.string().optional()
})

export const initOptionsSchema = z.object({
  output: pathSchema,
  transport: z.string(),
  auth: z.string().optional(),
  header: z.array(z.string()).optional(),
  save: z.boolean(),
  configFile: z.string()
})

export const updateOptionsSchema = z.object({
  url: urlSchema.optional(),
  transport: transportTypeSchema.optional(),
  auth: z.string().optional(),
  header: z.array(z.string()).optional(),
  configFile: z.string()
})

export const mcpServerInfoSchema = z.object({
  url: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  tools: z.array(z.any())
})

export const prettierParserSchema = z.enum(['typescript', 'markdown', 'html', 'json'])

export type TransportType = z.infer<typeof transportTypeSchema>
export type Headers = z.infer<typeof headersSchema>
export type IntegrationName = z.infer<typeof integrationNameSchema>
export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>
export type GeneratorOptions = z.infer<typeof generatorOptionsSchema>
export type ConfigManagerOptions = z.infer<typeof configManagerOptionsSchema>
export type InitOptions = z.infer<typeof initOptionsSchema>
export type UpdateOptions = z.infer<typeof updateOptionsSchema>
export type McpServerInfo = z.infer<typeof mcpServerInfoSchema>
export type PrettierParser = z.infer<typeof prettierParserSchema>
