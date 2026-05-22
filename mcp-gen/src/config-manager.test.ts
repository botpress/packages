import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConfigManager } from './config-manager.js'
import * as fs from 'fs/promises'

vi.mock('fs/promises')

describe('ConfigManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('save', () => {
    it('should create directory and write validated config as JSON', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      await new ConfigManager().save('/output', {
        name: 'test-integration',
        url: 'http://localhost:3000',
        type: 'http'
      })

      expect(fs.mkdir).toHaveBeenCalledWith('/output', { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('mcp-server.json'),
        expect.stringContaining('"name": "test-integration"'),
        expect.objectContaining({ encoding: 'utf-8' })
      )
    })

    it('should use custom config filename', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      await new ConfigManager({ configFilename: 'custom.json' }).save('/output', {
        name: 'test',
        url: 'http://localhost:3000',
        type: 'http'
      })

      expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('custom.json'), expect.any(String), expect.any(Object))
    })

    it('should wrap write errors with context', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'))

      await expect(new ConfigManager().save('/output', {
        name: 'test',
        url: 'http://localhost:3000',
        type: 'http'
      })).rejects.toThrow('Failed to save config: Permission denied')
    })

    it('should validate config before saving', async () => {
      await expect(new ConfigManager().save('/output', {
        name: 'Invalid Name',
        url: 'not-a-url',
        type: 'invalid'
      } as any)).rejects.toThrow()
    })
  })

  describe('load', () => {
    it('should parse and validate config from file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        name: 'test-integration',
        url: 'http://localhost:3000',
        type: 'http'
      }))

      const config = await new ConfigManager().load('/output')
      expect(config).toEqual({ name: 'test-integration', url: 'http://localhost:3000', type: 'http' })
    })

    it('should return null when file does not exist (ENOENT)', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      vi.mocked(fs.readFile).mockRejectedValue(error)

      expect(await new ConfigManager().load('/output')).toBeNull()
    })

    it('should return null for empty file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('')
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(await new ConfigManager().load('/output')).toBeNull()
    })

    it('should return null for invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('not valid json')
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(await new ConfigManager().load('/output')).toBeNull()
    })

    it('should throw for empty output directory', async () => {
      await expect(new ConfigManager().load('')).rejects.toThrow('Output directory path is required')
    })

    it('should warn on non-ENOENT read errors', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      vi.mocked(fs.readFile).mockRejectedValue(error)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      expect(await new ConfigManager().load('/output')).toBeNull()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error reading config'), expect.any(String))
    })
  })

  describe('createConfig', () => {
    it('should create validated config object', () => {
      const config = new ConfigManager().createConfig('test', 'http://localhost:3000', 'sse', { Authorization: 'Bearer token' })
      expect(config).toEqual({
        name: 'test',
        url: 'http://localhost:3000',
        type: 'sse',
        headers: { Authorization: 'Bearer token' }
      })
    })
  })

  describe('findConfig', () => {
    it('should find config in current directory', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        name: 'test',
        url: 'http://localhost:3000',
        type: 'http'
      }))

      const result = await new ConfigManager().findConfig('/start')
      expect(result).toEqual({
        dir: '/start',
        config: expect.objectContaining({ name: 'test' })
      })
    })

    it('should return null when no config found', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      vi.mocked(fs.readFile).mockRejectedValue(error)
      vi.mocked(fs.readdir).mockResolvedValue([])

      expect(await new ConfigManager().findConfig('/start')).toBeNull()
    })

    it('should search subdirectories up to maxDepth', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'

      let calls = 0
      vi.mocked(fs.readFile).mockImplementation(async (path: any) => {
        calls++
        if (path.includes('subdir') && calls > 1) {
          return JSON.stringify({ name: 'test', url: 'http://localhost:3000', type: 'http' })
        }
        throw error
      })
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'subdir', isDirectory: () => true } as any
      ])

      const result = await new ConfigManager().findConfig('/start', 2)
      expect(result).toEqual({
        dir: expect.stringContaining('subdir'),
        config: expect.objectContaining({ name: 'test' })
      })
    })

    it('should skip hidden directories and node_modules', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      vi.mocked(fs.readFile).mockRejectedValue(error)
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: '.hidden', isDirectory: () => true },
        { name: 'node_modules', isDirectory: () => true },
        { name: 'valid', isDirectory: () => true }
      ] as any)

      await new ConfigManager().findConfig('/start', 1)

      const readFileCalls = vi.mocked(fs.readFile).mock.calls
      expect(readFileCalls.some((call) => call[0].toString().includes('.hidden'))).toBe(false)
      expect(readFileCalls.some((call) => call[0].toString().includes('node_modules'))).toBe(false)
    })

    it('should limit subdirectory search to 50 directories', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      vi.mocked(fs.readFile).mockRejectedValue(error)
      vi.mocked(fs.readdir).mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          name: `dir${i}`,
          isDirectory: () => true
        })) as any
      )

      await new ConfigManager().findConfig('/start', 1)

      expect(vi.mocked(fs.readFile).mock.calls.length).toBeLessThanOrEqual(51)
    })
  })
})
