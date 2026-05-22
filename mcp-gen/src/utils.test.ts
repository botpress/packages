import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { writeFormattedFile, getLatestNpmVersion, parseHeaders } from './utils.js'
import * as fs from 'fs/promises'
import * as prettier from 'prettier'

vi.mock('fs/promises')
vi.mock('prettier')

describe('utils', () => {
  describe('writeFormattedFile', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should format content with prettier and write to file', async () => {
      vi.mocked(prettier.format).mockResolvedValue('formatted content')
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      await writeFormattedFile('/path/to/file.ts', 'unformatted content', 'typescript')

      expect(prettier.format).toHaveBeenCalledWith('unformatted content', {
        parser: 'typescript',
        printWidth: 120,
        singleQuote: true,
        trailingComma: 'none',
        semi: false,
        bracketSpacing: true,
        requirePragma: false
      })

      expect(fs.writeFile).toHaveBeenCalledWith('/path/to/file.ts', 'formatted content', 'utf-8')
    })
  })

  describe('getLatestNpmVersion', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      global.fetch = vi.fn()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should return latest version from npm registry', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '2.0.0' })
      } as any)

      const version = await getLatestNpmVersion('@botpress/sdk', '1.0.0')

      expect(version).toBe('2.0.0')
      expect(global.fetch).toHaveBeenCalledWith('https://registry.npmjs.org/@botpress/sdk/latest')
    })

    it('should return fallback on HTTP failure', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as any)
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(await getLatestNpmVersion('@botpress/sdk', '1.0.0')).toBe('1.0.0')
    })

    it('should return fallback on network error', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(await getLatestNpmVersion('@botpress/sdk', '1.0.0')).toBe('1.0.0')
    })
  })

  describe('parseHeaders', () => {
    it('should parse "Key: Value" format headers', () => {
      expect(parseHeaders(['Content-Type: application/json', 'Authorization: Bearer token'])).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token'
      })
    })

    it('should handle colons in header values (e.g. URLs)', () => {
      expect(parseHeaders(['X-Custom: http://example.com:8080/path'])).toEqual({
        'X-Custom': 'http://example.com:8080/path'
      })
    })

    it('should trim whitespace from keys and values', () => {
      expect(parseHeaders(['  Content-Type  :  application/json  '])).toEqual({
        'Content-Type': 'application/json'
      })
    })

    it('should merge with and override saved headers', () => {
      expect(parseHeaders(['Content-Type: application/json'], { 'X-Existing': 'kept', 'Content-Type': 'text/html' })).toEqual({
        'X-Existing': 'kept',
        'Content-Type': 'application/json'
      })
    })

    it('should return saved headers when no new headers provided', () => {
      expect(parseHeaders(undefined, { 'X-Custom': 'value' })).toEqual({ 'X-Custom': 'value' })
      expect(parseHeaders(undefined)).toEqual({})
    })

    it('should throw on invalid format (missing or leading colon)', () => {
      expect(() => parseHeaders(['InvalidHeader'])).toThrow('Invalid header format')
      expect(() => parseHeaders([':value'])).toThrow('Invalid header format')
    })
  })
})
