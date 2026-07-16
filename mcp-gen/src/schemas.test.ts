import { describe, it, expect } from 'vitest'
import {
  urlSchema,
  headerNameSchema,
  integrationNameSchema,
  mcpServerConfigSchema,
  generatorOptionsSchema
} from './schemas.js'

describe('schemas', () => {
  describe('urlSchema', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      expect(urlSchema.parse('http://localhost:3000')).toBe('http://localhost:3000')
      expect(urlSchema.parse('https://api.example.com')).toBe('https://api.example.com')
      expect(urlSchema.parse('http://192.168.1.1:8080/path')).toBe('http://192.168.1.1:8080/path')
    })

    it('should reject non-HTTP protocols', () => {
      expect(() => urlSchema.parse('ftp://example.com')).toThrow('URL must use http: or https: protocol')
      expect(() => urlSchema.parse('ws://example.com')).toThrow()
    })

    it('should reject malformed URLs', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow()
      expect(() => urlSchema.parse('')).toThrow()
    })
  })

  describe('headerNameSchema', () => {
    it('should accept RFC 7230 compliant header names', () => {
      expect(headerNameSchema.parse('Content-Type')).toBe('Content-Type')
      expect(headerNameSchema.parse('X-Custom-Header')).toBe('X-Custom-Header')
    })

    it('should reject non-compliant header names', () => {
      expect(() => headerNameSchema.parse('Invalid Header')).toThrow('Invalid header name')
      expect(() => headerNameSchema.parse('header:value')).toThrow()
    })
  })

  describe('integrationNameSchema', () => {
    it('should accept lowercase alphanumeric names with hyphens', () => {
      expect(integrationNameSchema.parse('my-integration')).toBe('my-integration')
      expect(integrationNameSchema.parse('test123')).toBe('test123')
    })

    it('should reject names with uppercase, underscores, spaces, or special chars', () => {
      expect(() => integrationNameSchema.parse('MyIntegration')).toThrow('must contain only lowercase')
      expect(() => integrationNameSchema.parse('my_integration')).toThrow('must contain only lowercase')
      expect(() => integrationNameSchema.parse('my integration')).toThrow('must contain only lowercase')
      expect(() => integrationNameSchema.parse('my@integration')).toThrow('must contain only lowercase')
    })

    it('should enforce length limits', () => {
      expect(() => integrationNameSchema.parse('')).toThrow()
      expect(() => integrationNameSchema.parse('a'.repeat(51))).toThrow('50 characters or less')
    })
  })

  describe('mcpServerConfigSchema', () => {
    it('should accept valid config with optional headers', () => {
      expect(mcpServerConfigSchema.parse({
        name: 'test',
        url: 'http://localhost:3000',
        type: 'http'
      })).toBeDefined()

      expect(mcpServerConfigSchema.parse({
        name: 'test',
        url: 'http://localhost:3000',
        type: 'sse',
        headers: { Authorization: 'Bearer token' }
      })).toBeDefined()
    })

    it('should reject invalid fields', () => {
      expect(() => mcpServerConfigSchema.parse({
        name: 'Invalid Name',
        url: 'http://localhost:3000',
        type: 'http'
      })).toThrow()
    })
  })

  describe('generatorOptionsSchema', () => {
    it('should require integrationName, mcpServerUrl, and outputDir', () => {
      expect(generatorOptionsSchema.parse({
        integrationName: 'test',
        mcpServerUrl: 'http://localhost:3000',
        outputDir: './output'
      })).toBeDefined()

      expect(() => generatorOptionsSchema.parse({
        integrationName: 'test',
        mcpServerUrl: 'http://localhost:3000'
      })).toThrow()
    })
  })
})
